-- Phase 1: real data backing for feed/discover/messages (previously mock-data.ts only).

-- profiles had no column to store a photo path at all (only liveness_video_path).
-- avatar_path = small profile photo, cover_path = the large Discover-card image.
ALTER TABLE public.profiles
  ADD COLUMN avatar_path TEXT,
  ADD COLUMN cover_path TEXT;

-- ── Mode visibility helper ──────────────────────────────────────────────
-- Mirrors src/lib/modes.ts visibleModes()/active-mode.tsx entitlement-override logic,
-- server-side, so RLS and the client stay in sync:
--   matrimonial (Nikah) → requires is_verified (Stripe Identity, Phase 4)
--   sisterhood/brotherhood → requires matching verified_gender
--   any mode with an active entitlement is visible regardless of the above
CREATE OR REPLACE FUNCTION public.can_view_mode(_user_id UUID, _mode public.app_mode)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.mode_entitlements
      WHERE user_id = _user_id AND mode = _mode AND is_active
    )
    OR (
      _mode = 'matrimonial' AND EXISTS (
        SELECT 1 FROM public.profiles WHERE id = _user_id AND is_verified
      )
    )
    OR (
      _mode = 'sisterhood' AND EXISTS (
        SELECT 1 FROM public.profiles WHERE id = _user_id AND verified_gender = 'female'
      )
    )
    OR (
      _mode = 'brotherhood' AND EXISTS (
        SELECT 1 FROM public.profiles WHERE id = _user_id AND verified_gender = 'male'
      )
    )
$$;

-- RLS-policy internal only (same convention as has_role()) — not a public RPC.
REVOKE EXECUTE ON FUNCTION public.can_view_mode(UUID, public.app_mode) FROM PUBLIC, anon, authenticated;

-- ── Posts (Feed) ─────────────────────────────────────────────────────────
-- author_id/user_id/sender_id below reference public.profiles(id) rather than
-- auth.users(id) directly (profiles.id === auth.users.id 1:1 via the
-- handle_new_user trigger) so PostgREST can embed joins, e.g.
-- `.select("*, profiles(*)")` — it can't auto-detect a join through auth.users.
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode public.app_mode NOT NULL,
  image_path TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '' CHECK (char_length(caption) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View posts in visible modes" ON public.posts
  FOR SELECT TO authenticated
  USING (public.can_view_mode(auth.uid(), mode));
CREATE POLICY "Create own posts in visible modes" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.can_view_mode(auth.uid(), mode));
CREATE POLICY "Delete own posts" ON public.posts
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

CREATE INDEX posts_mode_created_at_idx ON public.posts (mode, created_at DESC);

-- ── Post likes ───────────────────────────────────────────────────────────
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View likes on visible posts" ON public.post_likes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id AND public.can_view_mode(auth.uid(), p.mode)
    )
  );
CREATE POLICY "Like visible posts" ON public.post_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id AND public.can_view_mode(auth.uid(), p.mode)
    )
  );
CREATE POLICY "Unlike own like" ON public.post_likes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── Threads / thread members / messages ────────────────────────────────
CREATE TABLE public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode public.app_mode NOT NULL,
  kind TEXT NOT NULL DEFAULT 'dm' CHECK (kind IN ('dm', 'group')),
  title TEXT,
  has_wali BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.thread_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'wali')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (thread_id, user_id)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL CHECK (char_length(body) <= 1000),
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER so membership checks don't recurse through thread_members' own RLS.
CREATE OR REPLACE FUNCTION public.is_thread_member(_thread_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.thread_members
    WHERE thread_id = _thread_id AND user_id = _user_id
  )
$$;

-- RLS-policy internal only — not a public RPC.
REVOKE EXECUTE ON FUNCTION public.is_thread_member(UUID, UUID) FROM PUBLIC, anon, authenticated;

-- Reads are RLS-gated by membership; writes go exclusively through the
-- SECURITY DEFINER RPCs below (no direct INSERT/UPDATE/DELETE policies),
-- so multi-row writes (thread + first members) stay transactional and
-- there's no client-side window where a thread exists with no members.
CREATE POLICY "Members view their threads" ON public.threads
  FOR SELECT TO authenticated
  USING (public.is_thread_member(id, auth.uid()));

CREATE POLICY "Members view thread membership" ON public.thread_members
  FOR SELECT TO authenticated
  USING (public.is_thread_member(thread_id, auth.uid()));

CREATE POLICY "Members view thread messages" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_thread_member(thread_id, auth.uid()));

CREATE TRIGGER threads_updated_at BEFORE UPDATE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX thread_members_user_id_idx ON public.thread_members (user_id);
CREATE INDEX messages_thread_id_created_at_idx ON public.messages (thread_id, created_at);

-- Starts (or returns the existing) DM thread between the caller and _other_user_id
-- in _mode. Both must currently be able to view that mode.
CREATE OR REPLACE FUNCTION public.start_dm_thread(_other_user_id UUID, _mode public.app_mode)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _thread_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF auth.uid() = _other_user_id THEN
    RAISE EXCEPTION 'Cannot start a thread with yourself';
  END IF;
  IF NOT public.can_view_mode(auth.uid(), _mode) OR NOT public.can_view_mode(_other_user_id, _mode) THEN
    RAISE EXCEPTION 'Mode not available for one or both users';
  END IF;

  SELECT tm1.thread_id INTO _thread_id
  FROM public.thread_members tm1
  JOIN public.thread_members tm2 ON tm2.thread_id = tm1.thread_id
  JOIN public.threads t ON t.id = tm1.thread_id
  WHERE t.kind = 'dm' AND t.mode = _mode
    AND tm1.user_id = auth.uid() AND tm2.user_id = _other_user_id
  LIMIT 1;

  IF _thread_id IS NOT NULL THEN
    RETURN _thread_id;
  END IF;

  INSERT INTO public.threads (mode, kind) VALUES (_mode, 'dm') RETURNING id INTO _thread_id;
  INSERT INTO public.thread_members (thread_id, user_id) VALUES
    (_thread_id, auth.uid()),
    (_thread_id, _other_user_id);

  RETURN _thread_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.start_dm_thread(UUID, public.app_mode) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_dm_thread(UUID, public.app_mode) TO authenticated;

-- Sends a message as the caller into a thread they belong to.
CREATE OR REPLACE FUNCTION public.send_message(_thread_id UUID, _body TEXT)
RETURNS public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _trimmed TEXT;
  _row public.messages;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_thread_member(_thread_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this thread';
  END IF;

  _trimmed := btrim(_body);
  IF _trimmed = '' OR char_length(_trimmed) > 1000 THEN
    RAISE EXCEPTION 'Message must be 1-1000 characters';
  END IF;

  INSERT INTO public.messages (thread_id, sender_id, body)
  VALUES (_thread_id, auth.uid(), _trimmed)
  RETURNING * INTO _row;

  UPDATE public.threads SET updated_at = now() WHERE id = _thread_id;

  RETURN _row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_message(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_message(UUID, TEXT) TO authenticated;

-- ── Storage: post images (new bucket) ──────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "post_images_select_authenticated" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'post-images');
CREATE POLICY "post_images_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "post_images_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── Storage: loosen profile-photos read policy ─────────────────────────
-- Feed/Discover need to show other users' photos. Writes stay owner-only;
-- only the SELECT policy changes (was: owner-only read, which made the
-- discovery surfaces impossible to build against real data).
DROP POLICY IF EXISTS "photos_select_own" ON storage.objects;
CREATE POLICY "photos_select_authenticated" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-photos');
