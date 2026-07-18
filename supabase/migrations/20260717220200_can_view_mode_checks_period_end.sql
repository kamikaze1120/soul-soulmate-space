-- is_active alone isn't sufficient: a manually-inserted trial row (e.g. the
-- wali 14-day trial from redeem_wali_invite) never gets flipped to false by
-- a Stripe webhook the way a real cancelled subscription does. Guard against
-- an expired-but-still-is_active row granting access forever.
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
        AND (current_period_end IS NULL OR current_period_end > now())
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
