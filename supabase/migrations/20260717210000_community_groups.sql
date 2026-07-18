-- Groups: multi-member community threads (distinct from the existing
-- kind='group', which is specifically a Nikah DM + wali). Any verified
-- member of a mode can create one and invite their existing DM connections
-- into it; cross-gender invites are off by default and only an admin can
-- flip that switch per-group.

ALTER TABLE public.threads DROP CONSTRAINT IF EXISTS threads_kind_check;
ALTER TABLE public.threads ADD CONSTRAINT threads_kind_check
  CHECK (kind IN ('dm', 'group', 'community'));
ALTER TABLE public.threads
  ADD COLUMN creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN allow_cross_gender BOOLEAN NOT NULL DEFAULT false;

-- Admin-only: flip the cross-gender switch on a community group.
CREATE POLICY "Admins toggle group cross-gender" ON public.threads
  FOR UPDATE TO authenticated
  USING (kind = 'community' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (kind = 'community' AND public.has_role(auth.uid(), 'admin'));

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

-- "Connected" = caller currently shares a DM (kind='dm') thread with the
-- other user in the given mode. Deliberately not a separate table — DMs
-- already model exactly this relationship.
CREATE OR REPLACE FUNCTION public.get_connections(_mode public.app_mode)
RETURNS SETOF public.discoverable_profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dp.*
  FROM public.discoverable_profiles dp
  WHERE dp.id IN (
    SELECT tm2.user_id
    FROM public.thread_members tm1
    JOIN public.thread_members tm2 ON tm2.thread_id = tm1.thread_id AND tm2.user_id <> tm1.user_id
    JOIN public.threads t ON t.id = tm1.thread_id
    WHERE tm1.user_id = auth.uid() AND t.kind = 'dm' AND t.mode = _mode
  )
$$;

REVOKE EXECUTE ON FUNCTION public.get_connections(public.app_mode) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_connections(public.app_mode) TO authenticated;

CREATE OR REPLACE FUNCTION public.invite_to_group(_thread_id UUID, _invitee_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _thread public.threads;
  _inviter_gender public.gender;
  _invitee_gender public.gender;
  _connected BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT * INTO _thread FROM public.threads WHERE id = _thread_id AND kind = 'community';
  IF _thread IS NULL THEN
    RAISE EXCEPTION 'Group not found';
  END IF;
  IF NOT public.is_thread_member(_thread_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  -- Must already be a DM connection of the inviter, in the group's mode.
  SELECT EXISTS (
    SELECT 1
    FROM public.thread_members tm1
    JOIN public.thread_members tm2 ON tm2.thread_id = tm1.thread_id AND tm2.user_id = _invitee_id
    JOIN public.threads t ON t.id = tm1.thread_id
    WHERE tm1.user_id = auth.uid() AND t.kind = 'dm' AND t.mode = _thread.mode
  ) INTO _connected;
  IF NOT _connected THEN
    RAISE EXCEPTION 'You can only invite people you are already connected with';
  END IF;

  IF NOT _thread.allow_cross_gender THEN
    SELECT verified_gender INTO _inviter_gender FROM public.profiles WHERE id = auth.uid();
    SELECT verified_gender INTO _invitee_gender FROM public.profiles WHERE id = _invitee_id;
    IF _inviter_gender IS DISTINCT FROM _invitee_gender THEN
      RAISE EXCEPTION 'Cross-gender invites are disabled for this group';
    END IF;
  END IF;

  IF NOT public.can_view_mode(_invitee_id, _thread.mode) THEN
    RAISE EXCEPTION 'That person does not have access to this mode';
  END IF;

  INSERT INTO public.thread_members (thread_id, user_id) VALUES (_thread_id, _invitee_id)
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  UPDATE public.threads SET updated_at = now() WHERE id = _thread_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.invite_to_group(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invite_to_group(UUID, UUID) TO authenticated;
