-- Admins can post/browse in any mode regardless of gender-lock or
-- verification — needed so a single "Ummah" seed/admin account can post
-- across Nikah, Sisterhood, and Brotherhood without juggling three
-- separate gender-flagged accounts. Confirmed with product owner: admin
-- role is treated as sensitive since it overrides the core segregation rule.
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
