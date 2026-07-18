-- Reversed from the first wali design: wali accounts get NO mode access at
-- all (not even paid) — their only surface is the specific thread(s) they
-- were invited into (gated by is_thread_member, untouched by this). Also
-- free now — no entitlement, no Stripe.
CREATE OR REPLACE FUNCTION public.can_view_mode(_user_id UUID, _mode public.app_mode)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR (
      NOT public.has_role(_user_id, 'wali')
      AND (
        EXISTS (
          SELECT 1 FROM public.mode_entitlements
          WHERE user_id = _user_id AND mode = _mode AND is_active
            AND (current_period_end IS NULL OR current_period_end > now())
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
      )
    )
$$;

REVOKE EXECUTE ON FUNCTION public.can_view_mode(UUID, public.app_mode) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_mode(UUID, public.app_mode) TO authenticated;

-- redeem_wali_invite() no longer grants a mode_entitlements trial row —
-- wali access is free and thread-scoped only, nothing to unlock via
-- can_view_mode anymore.
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

  RETURN _invite.thread_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_wali_invite(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_wali_invite(TEXT) TO authenticated;
