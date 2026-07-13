-- ── Reports (minimal moderation) ────────────────────────────────────────
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'profile', 'message')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) <= 200),
  details TEXT NOT NULL DEFAULT '' CHECK (char_length(details) <= 2000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters view own reports" ON public.reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());
CREATE POLICY "Admins view all reports" ON public.reports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users file reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Admins update report status" ON public.reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX reports_status_created_at_idx ON public.reports (status, created_at DESC);

-- ── Add Wali to an existing Nikah DM ────────────────────────────────────
-- Scoped down from a full email-invite system: only works if the Wali
-- already has an Ummah account (looked up by email in auth.users, which a
-- SECURITY DEFINER function can query directly — no service-role/admin API
-- call needed from the app layer). Inviting someone with no account yet is
-- deferred (would need an email provider + signup-linking flow).
CREATE OR REPLACE FUNCTION public.add_wali_to_thread(_thread_id UUID, _wali_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _wali_id UUID;
  _thread public.threads;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_thread_member(_thread_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this thread';
  END IF;

  SELECT * INTO _thread FROM public.threads WHERE id = _thread_id;
  IF _thread.mode <> 'matrimonial' THEN
    RAISE EXCEPTION 'Wali can only be added to Nikah conversations';
  END IF;
  IF _thread.kind = 'group' THEN
    RAISE EXCEPTION 'This conversation already has a wali';
  END IF;

  SELECT id INTO _wali_id FROM auth.users WHERE lower(email) = lower(_wali_email) LIMIT 1;
  IF _wali_id IS NULL THEN
    RAISE EXCEPTION 'No Ummah account found for that email';
  END IF;
  IF _wali_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot add yourself as your own wali';
  END IF;

  INSERT INTO public.thread_members (thread_id, user_id, role) VALUES (_thread_id, _wali_id, 'wali')
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  UPDATE public.threads SET kind = 'group', has_wali = true, updated_at = now() WHERE id = _thread_id;

  INSERT INTO public.messages (thread_id, sender_id, body, is_system)
  VALUES (_thread_id, NULL, 'A wali joined the conversation.', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.add_wali_to_thread(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_wali_to_thread(UUID, TEXT) TO authenticated;
