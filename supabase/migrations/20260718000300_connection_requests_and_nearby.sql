-- Sisterhood/Brotherhood Discover moves from a Tinder-style swipe deck
-- (kept for Nikah only) to a nearby-people list with LinkedIn-style
-- connection requests: sending one doesn't create a DM immediately, the
-- recipient has to accept first.
CREATE TABLE public.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode public.app_mode NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE (requester_id, recipient_id, mode)
);

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties view their own requests" ON public.connection_requests
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR recipient_id = auth.uid());

CREATE OR REPLACE FUNCTION public.send_connection_request(_recipient_id UUID, _mode public.app_mode)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _request_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF auth.uid() = _recipient_id THEN
    RAISE EXCEPTION 'Cannot connect with yourself';
  END IF;
  IF NOT public.can_view_mode(auth.uid(), _mode) OR NOT public.can_view_mode(_recipient_id, _mode) THEN
    RAISE EXCEPTION 'Mode not available for one or both users';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.thread_members tm1
    JOIN public.thread_members tm2 ON tm2.thread_id = tm1.thread_id AND tm2.user_id = _recipient_id
    JOIN public.threads t ON t.id = tm1.thread_id
    WHERE tm1.user_id = auth.uid() AND t.kind = 'dm' AND t.mode = _mode
  ) THEN
    RAISE EXCEPTION 'Already connected';
  END IF;

  INSERT INTO public.connection_requests (requester_id, recipient_id, mode)
  VALUES (auth.uid(), _recipient_id, _mode)
  ON CONFLICT (requester_id, recipient_id, mode) DO NOTHING
  RETURNING id INTO _request_id;

  IF _request_id IS NULL THEN
    RAISE EXCEPTION 'Request already sent';
  END IF;

  RETURN _request_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_connection_request(UUID, public.app_mode) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_connection_request(UUID, public.app_mode) TO authenticated;

CREATE OR REPLACE FUNCTION public.respond_to_connection_request(_request_id UUID, _accept BOOLEAN)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _req public.connection_requests;
  _thread_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _req FROM public.connection_requests WHERE id = _request_id;
  IF _req IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF _req.recipient_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not your request to respond to';
  END IF;
  IF _req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request already resolved';
  END IF;

  IF _accept THEN
    UPDATE public.connection_requests SET status = 'accepted', responded_at = now() WHERE id = _request_id;
    INSERT INTO public.threads (mode, kind) VALUES (_req.mode, 'dm') RETURNING id INTO _thread_id;
    INSERT INTO public.thread_members (thread_id, user_id) VALUES
      (_thread_id, _req.requester_id),
      (_thread_id, _req.recipient_id);
    RETURN _thread_id;
  ELSE
    UPDATE public.connection_requests SET status = 'declined', responded_at = now() WHERE id = _request_id;
    RETURN NULL;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.respond_to_connection_request(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_to_connection_request(UUID, BOOLEAN) TO authenticated;

-- Nearby search: returns distance without exposing raw lat/long (keeps the
-- earlier privacy decision that discoverable_profiles never carries exact
-- coordinates) — the Haversine formula runs server-side and only the
-- rounded distance crosses the wire.
CREATE OR REPLACE FUNCTION public.get_nearby_profiles(
  _mode public.app_mode,
  _lat DOUBLE PRECISION,
  _lng DOUBLE PRECISION,
  _radius_miles DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  bio TEXT,
  city TEXT,
  country TEXT,
  avatar_path TEXT,
  cover_path TEXT,
  is_verified BOOLEAN,
  verified_gender public.gender,
  marital_status public.marital_status,
  primary_mode public.app_mode,
  blur_photos BOOLEAN,
  has_kids BOOLEAN,
  kids_age_groups TEXT[],
  distance_miles DOUBLE PRECISION,
  connection_status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    dp.id, dp.display_name, dp.bio, dp.city, dp.country, dp.avatar_path, dp.cover_path,
    dp.is_verified, dp.verified_gender, dp.marital_status, dp.primary_mode, dp.blur_photos,
    dp.has_kids, dp.kids_age_groups,
    (3959 * acos(least(1.0, greatest(-1.0,
      cos(radians(_lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(_lng))
      + sin(radians(_lat)) * sin(radians(p.latitude))
    )))) AS distance_miles,
    coalesce(
      (SELECT cr.status FROM public.connection_requests cr
       WHERE cr.mode = _mode
         AND ((cr.requester_id = auth.uid() AND cr.recipient_id = dp.id)
           OR (cr.requester_id = dp.id AND cr.recipient_id = auth.uid()))
       ORDER BY cr.created_at DESC LIMIT 1),
      'none'
    ) AS connection_status
  FROM public.discoverable_profiles dp
  JOIN public.profiles p ON p.id = dp.id
  WHERE dp.id <> auth.uid()
    AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
    AND public.can_view_mode(dp.id, _mode)
    AND public.can_view_mode(auth.uid(), _mode)
  ORDER BY distance_miles ASC
  LIMIT 50
$$;

REVOKE EXECUTE ON FUNCTION public.get_nearby_profiles(public.app_mode, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_nearby_profiles(public.app_mode, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
