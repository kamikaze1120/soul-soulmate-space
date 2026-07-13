import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { stripe } from "@/lib/stripe.server";
import { MODES, PRICING, type AppMode } from "@/lib/modes";
import type { Database } from "@/integrations/supabase/types";

const APP_MODES = new Set<AppMode>(["matrimonial", "sisterhood", "brotherhood"]);

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

// Prices are built inline via Checkout's price_data (no pre-created Stripe
// Dashboard products/prices needed — works purely from PRICING in modes.ts).
// See the trial-fee note below: this currently does a free 7-day trial via
// Stripe's native trial_period_days, not the $2.99 paid trial from PRICING.
// Not yet runtime-verified against a live Stripe account (no test-mode keys
// available while building this).
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { mode: AppMode; hasExistingActiveMode: boolean }) => {
    if (!APP_MODES.has(data.mode)) throw new Error("Invalid mode");
    return data;
  })
  .handler(async ({ context, data }) => {
    const { supabase, userId, claims } = context;
    const customerId = await getOrCreateStripeCustomer(
      supabase,
      userId,
      claims.email as string | undefined,
    );

    const monthlyAmount = Math.round(
      (data.hasExistingActiveMode ? PRICING.addOnPrice : PRICING.basePrice) * 100,
    );
    const productName = `Ummah — ${MODES[data.mode].title}`;

    // NOTE: this gives a free (Stripe-default) 7-day trial, not the $2.99
    // *paid* trial from PRICING.trialPrice. Charging during the trial needs
    // an invoice item on the subscription's first invoice — deferred until
    // product confirms the $2.99 fee is still wanted vs. a free trial.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            recurring: { interval: "month" },
            unit_amount: monthlyAmount,
            product_data: { name: productName },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: PRICING.trialDays,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
        metadata: { supabase_user_id: userId, mode: data.mode },
      },
      payment_method_collection: "if_required",
      success_url: `${getAppOrigin()}/modes?checkout=success`,
      cancel_url: `${getAppOrigin()}/modes?checkout=cancelled`,
      metadata: { supabase_user_id: userId, mode: data.mode },
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { url: session.url };
  });

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
