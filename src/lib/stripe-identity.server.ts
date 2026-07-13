import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { stripe } from "@/lib/stripe.server";

// Stripe's hosted verification flow (redirect to session.url) — same pattern
// as Checkout/the billing portal. Stripe hosts document + selfie capture
// itself, so no @capacitor/camera wiring is needed for this (native WebView
// just displays Stripe's page like any other browser would).
export const createVerificationSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: { supabase_user_id: userId },
      options: {
        document: {
          require_matching_selfie: true,
          require_live_capture: true,
        },
      },
      return_url: `${getAppOrigin()}/verify?result=return`,
    });

    if (!session.url) throw new Error("Stripe did not return a verification URL.");
    return { url: session.url };
  });

function getAppOrigin(): string {
  const origin = process.env.APP_ORIGIN;
  if (!origin) throw new Error("Missing APP_ORIGIN environment variable.");
  return origin;
}
