-- New access model: ID verification is a universal prerequisite (nothing
-- works before it, not just Nikah), mode eligibility comes from gender
-- (Sisterhood/Brotherhood) and marital_status (Nikah — married users are
-- excluded), and a single active subscription (any mode_entitlements row)
-- is still required on top of eligibility — one flat subscription now
-- covers every eligible mode at once rather than being purchased per-mode.
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
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = _user_id AND p.is_verified
          AND (
            (_mode = 'sisterhood' AND p.verified_gender = 'female')
            OR (_mode = 'brotherhood' AND p.verified_gender = 'male')
            OR (_mode = 'matrimonial' AND p.marital_status IS NOT NULL AND p.marital_status <> 'married')
          )
      )
      AND EXISTS (
        SELECT 1 FROM public.mode_entitlements me
        WHERE me.user_id = _user_id AND me.mode = _mode AND me.is_active
          AND (me.current_period_end IS NULL OR me.current_period_end > now())
      )
    )
$$;

REVOKE EXECUTE ON FUNCTION public.can_view_mode(UUID, public.app_mode) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_mode(UUID, public.app_mode) TO authenticated;
