-- Bug found live: onboarding's profile UPDATE was failing with
-- "permission denied for function can_view_mode". supabase-js's .update()
-- requests the updated row back (Prefer: return=representation), which
-- evaluates the profiles SELECT policy — and that policy calls
-- can_view_mode() in its USING clause. EXECUTE had been revoked from
-- `authenticated` (over-applying the has_role() "RLS-internal only"
-- convention), which broke every profiles read/write that goes through RLS.
GRANT EXECUTE ON FUNCTION public.can_view_mode(UUID, public.app_mode) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_thread_member(UUID, UUID) TO authenticated;
