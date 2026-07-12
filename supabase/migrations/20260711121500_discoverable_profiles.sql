-- profiles RLS only ever allowed a user to read their own row. Feed/Discover/
-- Messages need to show OTHER users' profiles, but a blanket row-open would
-- also expose exact latitude/longitude, wali_contact, and liveness_video_path
-- to anyone sharing a mode — real privacy/safety risk for this app. So:
--   1. Loosen profiles SELECT to "shared visible mode" (both sides eligible).
--   2. Add a security_invoker view exposing only the safe subset of columns
--      for reading OTHER users; the client uses this view (never raw
--      `profiles`) whenever it's rendering someone else's profile.

CREATE POLICY "View profiles in a shared visible mode" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR (public.can_view_mode(auth.uid(), 'matrimonial') AND public.can_view_mode(id, 'matrimonial'))
    OR (public.can_view_mode(auth.uid(), 'sisterhood') AND public.can_view_mode(id, 'sisterhood'))
    OR (public.can_view_mode(auth.uid(), 'brotherhood') AND public.can_view_mode(id, 'brotherhood'))
  );

-- security_invoker so this still runs the querying user's RLS, not the view
-- owner's — without it a view silently bypasses row security in Postgres.
CREATE VIEW public.discoverable_profiles
WITH (security_invoker = true) AS
SELECT
  id,
  display_name,
  bio,
  city,
  country,
  verified_gender,
  is_verified,
  primary_mode,
  avatar_path,
  cover_path,
  blur_photos,
  marital_status,
  has_kids,
  kids_age_groups,
  created_at
FROM public.profiles;

GRANT SELECT ON public.discoverable_profiles TO authenticated;

-- Needed for supabase-js postgres_changes realtime subscriptions on messages.
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
