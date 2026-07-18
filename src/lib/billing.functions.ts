import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { stripe } from "@/lib/stripe.server";
import { PRICING, eligibleModes } from "@/lib/modes";
import type { Database } from "@/integrations/supabase/types";

async function getOrCreateStripeCustomer(
  supabase: SupabaseClient<Database>,
  userId: string,
  email: string | undefined,
): Promise<string> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);
  if (updateError) throw updateError;

  return customer.id;
}

// One flat subscription unlocks every mode the member is eligible for
// (gender for Sisterhood/Brotherhood, marital status for Nikah) — there's
// no more per-mode purchase. Price is built inline via Checkout's price_data
// (no pre-created Stripe Dashboard product/price needed).
// NOTE: this gives a free (Stripe-default) 7-day trial, not the $2.99 *paid*
// trial from PRICING.trialPrice. Charging during the trial needs an invoice
// item on the subscription's first invoice — deferred until product
// confirms the $2.99 fee is still wanted vs. a free trial.
export const createCheckoutSession = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(
  async ({ context }) => {
    const { supabase, userId, claims } = context;

    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("verified_gender, marital_status, is_verified")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    // Wali accounts are free and never unlock modes at all — nothing to
    // check out for.
    if ((roles ?? []).some((r) => r.role === "wali")) {
      throw new Error("Wali accounts don't need a subscription.");
    }
    if (!profile?.is_verified) {
      throw new Error("Verify your identity before subscribing.");
    }

    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    const modes = eligibleModes(
      profile.verified_gender,
      profile.marital_status,
      profile.is_verified,
      isAdmin,
    );
    if (modes.length === 0) {
      throw new Error("No modes available for your account yet.");
    }

    const customerId = await getOrCreateStripeCustomer(
      supabase,
      userId,
      claims.email as string | undefined,
    );

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            recurring: { interval: "month" },
            unit_amount: Math.round(PRICING.basePrice * 100),
            product_data: { name: "Ummah membership" },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: PRICING.trialDays,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
        metadata: { supabase_user_id: userId, modes: modes.join(",") },
      },
      payment_method_collection: "if_required",
      success_url: `${getAppOrigin()}/modes?checkout=success`,
      cancel_url: `${getAppOrigin()}/modes?checkout=cancelled`,
      metadata: { supabase_user_id: userId, modes: modes.join(",") },
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { url: session.url };
  },
);

export const createBillingPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!profile?.stripe_customer_id) {
      throw new Error("No billing account yet — start a subscription first.");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${getAppOrigin()}/modes`,
    });
    return { url: session.url };
  });

function getAppOrigin(): string {
  const origin = process.env.APP_ORIGIN;
  if (!origin) throw new Error("Missing APP_ORIGIN environment variable.");
  return origin;
}
