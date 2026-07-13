import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Separate endpoint + signing secret from stripe-webhook.ts: Stripe Identity
// events are configured as their own webhook endpoint in the Dashboard (they
// don't share a signing secret with the Checkout/Billing endpoint).
export const Route = createFileRoute("/api/stripe-identity-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("stripe-signature");
        const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET;

        if (!signature) return new Response("Missing stripe-signature header", { status: 400 });
        if (!webhookSecret) return new Response("Webhook not configured", { status: 500 });

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
        } catch (err) {
          return new Response(`Signature verification failed: ${(err as Error).message}`, {
            status: 400,
          });
        }

        try {
          if (event.type === "identity.verification_session.verified") {
            await markVerified(event.data.object as Stripe.Identity.VerificationSession);
          }
          // requires_input (declined/expired) intentionally not handled yet —
          // no UI surfaces a "verification failed, retry" state; is_verified
          // simply stays false and /verify lets them start again.
        } catch (err) {
          console.error("[stripe-identity-webhook] handler error", err);
          return new Response("Webhook handler error", { status: 500 });
        }

        return Response.json({ received: true });
      },
    },
  },
});

async function markVerified(session: Stripe.Identity.VerificationSession) {
  const userId = session.metadata.supabase_user_id;
  if (!userId) {
    console.error(
      "[stripe-identity-webhook] session missing supabase_user_id metadata",
      session.id,
    );
    return;
  }

  // verified_gender stays whatever the user self-reported at onboarding —
  // deliberately not overwritten from Stripe's extracted document data (see
  // the plan's open question on source-of-truth for gender; Sisterhood/
  // Brotherhood only ever gated on the self-reported value regardless).
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ is_verified: true })
    .eq("id", userId);
  if (error) throw error;
}
