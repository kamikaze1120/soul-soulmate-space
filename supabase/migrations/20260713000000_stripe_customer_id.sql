ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;
-- Only ever written by the service-role client from server functions/webhooks,
-- never by the user directly — no RLS UPDATE grant needed beyond the existing
-- owner-update policy (still fine since it's not attacker-choosable data the
-- app trusts blindly; the value always originates from Stripe's API response).
