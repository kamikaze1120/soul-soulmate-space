-- get_nearby_profiles accepted _radius_miles but never applied it as a
-- filter — every call returned the same 50 nearest results regardless of
-- the radius the user picked. Wrap the distance calc in a CTE and filter
-- on it in the outer query.
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
  WITH candidates AS (
    SELECT
      dp.id, dp.display_name, dp.bio, dp.city, dp.country, dp.avatar_path, dp.cover_path,
      dp.is_verified, dp.verified_gender, dp.marital_status, dp.primary_mode, dp.blur_photos,
      dp.has_kids, dp.kids_age_groups,
      (3959 * acos(least(1.0, greatest(-1.0,
        cos(radians(_lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(_lng))
        + sin(radians(_lat)) * sin(radians(p.latitude))
      )))) AS distance_miles
    FROM public.discoverable_profiles dp
    JOIN public.profiles p ON p.id = dp.id
    WHERE dp.id <> auth.uid()
      AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      AND public.can_view_mode(dp.id, _mode)
      AND public.can_view_mode(auth.uid(), _mode)
  )
  SELECT
    c.id, c.display_name, c.bio, c.city, c.country, c.avatar_path, c.cover_path,
    c.is_verified, c.verified_gender, c.marital_status, c.primary_mode, c.blur_photos,
    c.has_kids, c.kids_age_groups, c.distance_miles,
    coalesce(
      (SELECT cr.status FROM public.connection_requests cr
       WHERE cr.mode = _mode
         AND ((cr.requester_id = auth.uid() AND cr.recipient_id = c.id)
           OR (cr.requester_id = c.id AND cr.recipient_id = auth.uid()))
       ORDER BY cr.created_at DESC LIMIT 1),
      'none'
    ) AS connection_status
  FROM candidates c
  WHERE c.distance_miles <= _radius_miles
  ORDER BY c.distance_miles ASC
  LIMIT 50
$$;

GRANT EXECUTE ON FUNCTION public.get_nearby_profiles(public.app_mode, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
