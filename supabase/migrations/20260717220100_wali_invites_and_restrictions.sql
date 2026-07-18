-- Wali as an account-level role (not just a per-thread label): signup is
-- gated behind an invite link generated from within a conversation, wali
-- access to Sisterhood/Brotherhood is paid-only (no free gender-based
-- access like regular members get), and a wali can be added to further
-- conversations later via new invite links without re-signing-up.

CREATE TABLE public.wali_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  redeemed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ
);

ALTER TABLE public.wali_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviters view their own invites" ON public.wali_invites
  FOR SELECT TO authenticated
  USING (inviter_id = auth.uid());

-- No public SELECT policy — the invite landing page reads via
-- get_wali_invite_info() below (SECURITY DEFINER) instead of a direct
-- table read, so unauthenticated visitors never need a grant on this table.

CREATE OR REPLACE FUNCTION public.create_wali_invite(_thread_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_thread_member(_thread_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this conversation';
  END IF;

  INSERT INTO public.wali_invites (inviter_id, thread_id)
  VALUES (auth.uid(), _thread_id)
  RETURNING token INTO _token;

  RETURN _token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_wali_invite(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_wali_invite(UUID) TO authenticated;

-- Public (unauthenticated-safe) lookup for the invite landing page: just
-- enough context to show "X invited you", never exposes the thread's
-- content or member list.
CREATE OR REPLACE FUNCTION public.get_wali_invite_info(_token TEXT)
RETURNS TABLE (inviter_name TEXT, mode public.app_mode, expired BOOLEAN, redeemed BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.display_name,
    t.mode,
    wi.expires_at < now(),
    wi.redeemed_by IS NOT NULL
  FROM public.wali_invites wi
  JOIN public.profiles p ON p.id = wi.inviter_id
  JOIN public.threads t ON t.id = wi.thread_id
  WHERE wi.token = _token
$$;

REVOKE EXECUTE ON FUNCTION public.get_wali_invite_info(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_wali_invite_info(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.redeem_wali_invite(_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite public.wali_invites;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _invite FROM public.wali_invites WHERE token = _token;
  IF _invite IS NULL THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;
  IF _invite.expires_at < now() THEN
    RAISE EXCEPTION 'This invite has expired';
  END IF;
  IF _invite.inviter_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot redeem your own invite';
  END IF;

  -- Each invite is single-use, but the same wali account can hold many
  -- invites over time (one per additional chat they're added to) — that's
  -- "family can add them to other chats" from a fresh invite each time.
  UPDATE public.wali_invites
  SET redeemed_by = auth.uid(), redeemed_at = now()
  WHERE id = _invite.id AND redeemed_by IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This invite has already been used';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'wali')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.thread_members (thread_id, user_id, role)
  VALUES (_invite.thread_id, auth.uid(), 'wali')
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  IF (SELECT kind FROM public.threads WHERE id = _invite.thread_id) = 'dm' THEN
    UPDATE public.threads SET kind = 'group', has_wali = true, updated_at = now()
    WHERE id = _invite.thread_id;
  END IF;

  INSERT INTO public.messages (thread_id, sender_id, body, is_system)
  VALUES (_invite.thread_id, NULL, 'A wali joined the conversation.', true);

  -- 14-day free trial, same shape as a Stripe-driven mode_entitlements row,
  -- so can_view_mode()'s existing entitlement check unlocks their gender's
  -- mode without any special-casing there.
  INSERT INTO public.mode_entitlements (user_id, mode, is_active, is_trial, current_period_end)
  SELECT auth.uid(), t.mode, true, true, now() + interval '14 days'
  FROM public.threads t WHERE t.id = _invite.thread_id
  ON CONFLICT (user_id, mode) DO NOTHING;

  RETURN _invite.thread_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_wali_invite(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_wali_invite(TEXT) TO authenticated;

-- ── Wali restrictions ────────────────────────────────────────────────────
-- can_view_mode(): wali accounts never get the free gender/verification
-- based access regular members get for Sisterhood/Brotherhood/Nikah — they
-- rely solely on an active mode_entitlements row (their 14-day trial from
-- redeem_wali_invite() above, then a paid subscription same as everyone
-- else). The specific thread they were invited into is unaffected by this —
-- that's gated by is_thread_member, not can_view_mode.
CREATE OR REPLACE FUNCTION public.can_view_mode(_user_id UUID, _mode public.app_mode)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.mode_entitlements
      WHERE user_id = _user_id AND mode = _mode AND is_active
    )
    OR (
      NOT public.has_role(_user_id, 'wali')
      AND (
        (
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
      )
    )
$$;

REVOKE EXECUTE ON FUNCTION public.can_view_mode(UUID, public.app_mode) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_mode(UUID, public.app_mode) TO authenticated;

-- A wali can't start new DM connections or create their own groups — their
-- only participation is the thread(s) they were explicitly invited into.
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
  IF public.has_role(auth.uid(), 'wali') THEN
    RAISE EXCEPTION 'Wali accounts cannot start new connections';
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

CREATE OR REPLACE FUNCTION public.create_group(_mode public.app_mode, _title TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _thread_id UUID;
  _trimmed TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF public.has_role(auth.uid(), 'wali') THEN
    RAISE EXCEPTION 'Wali accounts cannot create groups';
  END IF;
  IF _mode = 'matrimonial' THEN
    RAISE EXCEPTION 'Groups are not available in Nikah';
  END IF;
  IF NOT public.can_view_mode(auth.uid(), _mode) THEN
    RAISE EXCEPTION 'Mode not available';
  END IF;

  _trimmed := btrim(_title);
  IF _trimmed = '' OR char_length(_trimmed) > 100 THEN
    RAISE EXCEPTION 'Group name must be 1-100 characters';
  END IF;

  INSERT INTO public.threads (mode, kind, title, creator_id)
  VALUES (_mode, 'community', _trimmed, auth.uid())
  RETURNING id INTO _thread_id;

  INSERT INTO public.thread_members (thread_id, user_id) VALUES (_thread_id, auth.uid());

  RETURN _thread_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_group(public.app_mode, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_group(public.app_mode, TEXT) TO authenticated;
