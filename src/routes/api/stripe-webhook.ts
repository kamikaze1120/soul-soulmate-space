import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { AppMode } from "@/lib/modes";

const APP_MODES = new Set<AppMode>(["matrimonial", "sisterhood", "brotherhood"]);

export const Route = createFileRoute("/api/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("stripe-signature");
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
          switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
              await syncSubscription(event.data.object as Stripe.Subscription);
              break;
            case "customer.subscription.deleted":
              await deactivateSubscription(event.data.object as Stripe.Subscription);
              break;
            default:
              break; // ignore everything else
          }
        } catch (err) {
          console.error("[stripe-webhook] handler error", err);
          return new Response("Webhook handler error", { status: 500 });
        }

        return Response.json({ received: true });
      },
    },
  },
});

// A single subscription now covers every eligible mode at once (comma-list
// in metadata.modes, written by createCheckoutSession) rather than one
// subscription per mode — fan out to one mode_entitlements row per mode so
// can_view_mode()'s per-mode check still works unchanged.
async function syncSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.supabase_user_id;
  const modes = (subscription.metadata.modes ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter((m): m is AppMode => APP_MODES.has(m as AppMode));
  if (!userId || modes.length === 0) {
    console.error(
      "[stripe-webhook] subscription missing supabase_user_id/modes metadata",
      subscription.id,
    );
    return;
  }

  const isActive = subscription.status === "active" || subscription.status === "trialing";
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

  const { error } = await supabaseAdmin.from("mode_entitlements").upsert(
    modes.map((mode) => ({
      user_id: userId,
      mode,
      is_active: isActive,
      is_trial: subscription.status === "trialing",
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
      stripe_subscription_id: subscription.id,
    })),
    { onConflict: "user_id,mode" },
  );
  if (error) throw error;
}

async function deactivateSubscription(subscription: Stripe.Subscription) {
  const { error } = await supabaseAdmin
    .from("mode_entitlements")
    .update({ is_active: false })
    .eq("stripe_subscription_id", subscription.id);
  if (error) throw error;
}
