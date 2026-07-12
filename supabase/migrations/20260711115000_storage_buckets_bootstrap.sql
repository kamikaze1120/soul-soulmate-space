-- The original verification-videos / profile-photos buckets referenced by the
-- next migration's policies were created by hand in the Supabase dashboard,
-- not captured in any migration file. Recreated here so a fresh project
-- (e.g. a new Supabase project migrated from scratch) has them too.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('verification-videos', 'verification-videos', false),
  ('profile-photos', 'profile-photos', false)
ON CONFLICT (id) DO NOTHING;
