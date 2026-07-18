-- Posts had no creation UI at all, and no support for events/polls, or
-- comments (the feed's comment icon was a dead button). This extends posts
-- with a post_type discriminator and adds the poll/comment tables, plus a
-- single create_post() RPC so a poll's post row + option rows are created
-- transactionally (never a poll with zero options mid-failure).

ALTER TABLE public.posts
  ADD COLUMN post_type TEXT NOT NULL DEFAULT 'photo' CHECK (post_type IN ('photo', 'event', 'poll')),
  ADD COLUMN event_at TIMESTAMPTZ,
  ADD COLUMN event_location TEXT CHECK (char_length(event_location) <= 200),
  ALTER COLUMN image_path DROP NOT NULL,
  ADD CONSTRAINT posts_photo_requires_image CHECK (post_type <> 'photo' OR image_path IS NOT NULL);

-- ── Polls ────────────────────────────────────────────────────────────────
CREATE TABLE public.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (char_length(label) <= 120),
  position SMALLINT NOT NULL DEFAULT 0
);

-- post_id is denormalized onto votes (not just derivable via option_id) so a
-- single UNIQUE(post_id, user_id) can enforce "one vote per poll" — a
-- UNIQUE on (option_id, user_id) alone would still let a user vote for two
-- different options in the same poll.
CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View poll options on visible posts" ON public.poll_options
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.can_view_mode(auth.uid(), p.mode)));

CREATE POLICY "View poll votes on visible posts" ON public.poll_votes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.can_view_mode(auth.uid(), p.mode)));
CREATE POLICY "Vote on visible polls" ON public.poll_votes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.can_view_mode(auth.uid(), p.mode))
  );
CREATE POLICY "Change own vote" ON public.poll_votes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- poll_options has no direct INSERT policy — rows are only ever created by
-- create_post() below (SECURITY DEFINER), so a poll's options are always
-- written in the same transaction as the post itself.

-- ── Comments ─────────────────────────────────────────────────────────────
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View comments on visible posts" ON public.post_comments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.can_view_mode(auth.uid(), p.mode)));
CREATE POLICY "Comment on visible posts" ON public.post_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.can_view_mode(auth.uid(), p.mode))
  );
CREATE POLICY "Delete own comments" ON public.post_comments
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

CREATE INDEX post_comments_post_id_created_at_idx ON public.post_comments (post_id, created_at);

-- ── create_post(): single RPC for all three post types ─────────────────
CREATE OR REPLACE FUNCTION public.create_post(
  _mode public.app_mode,
  _post_type TEXT,
  _caption TEXT DEFAULT '',
  _image_path TEXT DEFAULT NULL,
  _event_at TIMESTAMPTZ DEFAULT NULL,
  _event_location TEXT DEFAULT NULL,
  _poll_options TEXT[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _post_id UUID;
  _opt TEXT;
  _i SMALLINT := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.can_view_mode(auth.uid(), _mode) THEN
    RAISE EXCEPTION 'Mode not available';
  END IF;
  IF _post_type NOT IN ('photo', 'event', 'poll') THEN
    RAISE EXCEPTION 'Invalid post type';
  END IF;
  IF _post_type = 'photo' AND _image_path IS NULL THEN
    RAISE EXCEPTION 'Photo posts require an image';
  END IF;
  IF _post_type = 'event' AND _event_at IS NULL THEN
    RAISE EXCEPTION 'Events require a date/time';
  END IF;
  IF _post_type = 'poll' AND (array_length(_poll_options, 1) IS NULL OR array_length(_poll_options, 1) < 2) THEN
    RAISE EXCEPTION 'Polls require at least 2 options';
  END IF;

  INSERT INTO public.posts (author_id, mode, post_type, caption, image_path, event_at, event_location)
  VALUES (auth.uid(), _mode, _post_type, coalesce(btrim(_caption), ''), _image_path, _event_at, _event_location)
  RETURNING id INTO _post_id;

  IF _post_type = 'poll' THEN
    FOREACH _opt IN ARRAY _poll_options LOOP
      INSERT INTO public.poll_options (post_id, label, position) VALUES (_post_id, btrim(_opt), _i);
      _i := _i + 1;
    END LOOP;
  END IF;

  RETURN _post_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_post(public.app_mode, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_post(public.app_mode, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT[]) TO authenticated;

-- Adds/changes a caller's own vote atomically (delete-then-insert would leave
-- a window with zero votes visible to concurrent readers; this RPC doesn't
-- eliminate that window either since it's two statements, but keeps the
-- "one active vote per user" invariant enforced server-side either way via
-- the UNIQUE(post_id, user_id) constraint + ON CONFLICT).
CREATE OR REPLACE FUNCTION public.vote_on_poll(_post_id UUID, _option_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.poll_options WHERE id = _option_id AND post_id = _post_id) THEN
    RAISE EXCEPTION 'Option does not belong to this poll';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.posts p WHERE p.id = _post_id AND public.can_view_mode(auth.uid(), p.mode)
  ) THEN
    RAISE EXCEPTION 'Mode not available';
  END IF;

  INSERT INTO public.poll_votes (post_id, option_id, user_id)
  VALUES (_post_id, _option_id, auth.uid())
  ON CONFLICT (post_id, user_id) DO UPDATE SET option_id = EXCLUDED.option_id, created_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.vote_on_poll(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vote_on_poll(UUID, UUID) TO authenticated;
