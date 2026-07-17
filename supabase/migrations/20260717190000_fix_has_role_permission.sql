-- has_role() is referenced from RLS policies queried by `authenticated`
-- (e.g. user_roles' "Admins manage roles" FOR ALL policy, which Postgres
-- evaluates on every SELECT alongside "Users view own roles" since both are
-- permissive policies on the same command). Postgres requires EXECUTE on any
-- function referenced in an RLS policy for the querying role, even when that
-- particular policy isn't the one that ultimately grants access. This was
-- silently causing every `select role from user_roles` from a logged-in user
-- to 403, which meant the admin bypass (isAdmin) never actually activated
-- client-side. Same root cause/fix shape as the earlier can_view_mode() grant.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
