// Server-only Stripe client. Never import this from client code.
// Lazy Proxy so STRIPE_SECRET_KEY is read per-request, not at module scope —
// on Cloudflare Workers, env is injected per-request and module-level reads
// evaluate to undefined (same reason src/integrations/supabase/client.server.ts
// uses this pattern).
import Stripe from "stripe";

function createStripeClient() {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }
  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" });
}

let _stripe: Stripe | undefined;

export const stripe = new Proxy({} as Stripe, {
  get(_, prop, receiver) {
    if (!_stripe) _stripe = createStripeClient();
    return Reflect.get(_stripe, prop, receiver);
  },
});
