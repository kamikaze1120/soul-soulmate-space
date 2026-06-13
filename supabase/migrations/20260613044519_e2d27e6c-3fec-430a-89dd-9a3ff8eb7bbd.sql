
CREATE POLICY "verif_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'verification-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "verif_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'verification-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "verif_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'verification-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "verif_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'verification-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "photos_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "photos_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "photos_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "photos_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
