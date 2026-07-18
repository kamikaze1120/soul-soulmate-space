import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, Users, ShieldCheck, Lock, Sparkles, Check, CreditCard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { MODES, PRICING, eligibleModes, type AppMode } from "@/lib/modes";
import { useActiveMode } from "@/lib/active-mode";
import { createCheckoutSession, createBillingPortalSession } from "@/lib/billing.functions";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/modes")({
  head: () => ({ meta: [{ title: "Modes · Ummah" }] }),
  component: ModesPage,
});

const ICONS: Record<AppMode, React.ReactNode> = {
  matrimonial: <Heart className="h-5 w-5" />,
  sisterhood: <Users className="h-5 w-5" />,
  brotherhood: <ShieldCheck className="h-5 w-5" />,
};

function ModesPage() {
  const { profile, entitlements, isAdmin, isWali, refresh } = useAuth();
  const { active, setActive } = useActiveMode();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const eligible = useMemo(
    () =>
      eligibleModes(
        profile?.verified_gender ?? null,
        profile?.marital_status ?? null,
        profile?.is_verified ?? false,
        isAdmin,
        isWali,
      ),
    [profile, isAdmin, isWali],
  );
  const entMap = new Map(entitlements.map((e) => [e.mode, e]));
  const hasSubscription = isAdmin || entitlements.some((e) => e.is_active);

  // Stripe redirects back here with ?checkout=success|cancelled after
  // Checkout. The webhook writes mode_entitlements asynchronously, so this
  // is a best-effort immediate refresh — it may need a moment/second visit
  // to reflect if the webhook hasn't landed yet.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (!checkout) return;
    if (checkout === "success") {
      toast.success("Subscription started — this may take a few seconds to unlock.");
      refresh();
    } else if (checkout === "cancelled") {
      toast.info("Checkout cancelled.");
    }
    navigate({ to: "/modes", search: {}, replace: true });
  }, [navigate, refresh]);

  const startCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start checkout — try again.");
      setCheckoutLoading(false);
    }
  };

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await createBillingPortalSession();
      window.location.href = url;
    } catch {
      toast.error("Couldn't open billing portal.");
      setPortalLoading(false);
    }
  };

  if (isWali) {
    return (
      <div className="px-4 pt-5">
        <EmptyState
          title="Not applicable for Wali accounts"
          description="Wali accounts are free and only take part in the conversation(s) they were invited to — there's nothing to subscribe to here."
        />
      </div>
    );
  }

  if (!profile?.is_verified && !isAdmin) {
    return (
      <div className="px-4 pt-5">
        <EmptyState
          title="Verify your identity first"
          description="Modes unlock once your ID is verified."
        />
      </div>
    );
  }

  return (
    <div className="px-4 pt-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Mode Switcher</h2>
        {hasSubscription && !isAdmin && (
          <button
            onClick={openBillingPortal}
            disabled={portalLoading}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-[var(--shadow-soft)] disabled:opacity-50"
          >
            <CreditCard className="h-3.5 w-3.5" /> Billing
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {isAdmin
          ? "Admin — unlimited access to every mode."
          : hasSubscription
            ? `Subscribed · $${PRICING.basePrice}/mo covers every mode you're eligible for.`
            : `Start your $${PRICING.trialPrice} ${PRICING.trialDays}-day trial — one subscription unlocks every mode below.`}
      </p>

      {!hasSubscription && eligible.length > 0 && (
        <button
          onClick={startCheckout}
          disabled={checkoutLoading}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--mode-matrimonial)] px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {checkoutLoading ? "Redirecting…" : `Start trial · $${PRICING.trialPrice}`}
        </button>
      )}

      <div className="mt-5 space-y-3">
        {(Object.keys(MODES) as AppMode[]).map((m) => {
          const meta = MODES[m];
          const ent = entMap.get(m);
          const isEligible = eligible.includes(m);
          const isActive = isAdmin || (!!ent?.is_active && isEligible);
          const isCurrent = active === m;

          if (!isEligible) {
            return (
              <div
                key={m}
                className="rounded-2xl border border-dashed border-border bg-card/60 p-4 opacity-70"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{meta.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {m === "matrimonial"
                        ? "Not available — Nikah is for unmarried members only"
                        : `Restricted — verified ${meta.genderLock} only`}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={m}
              className={`overflow-hidden rounded-2xl border bg-[var(--gradient-card)] shadow-[var(--shadow-soft)] transition ${
                isCurrent ? "border-foreground/60" : "border-border"
              }`}
            >
              <div className="h-1.5" style={{ background: `var(--mode-${m})` }} />
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-xl text-primary-foreground"
                    style={{ background: `var(--mode-${m})` }}
                  >
                    {ICONS[m]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-foreground">{meta.title}</div>
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          {meta.tagline}
                        </div>
                      </div>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--mode-brotherhood)] px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                          <Check className="h-3 w-3" />
                          {ent?.is_trial ? "Trial" : "Active"}
                        </span>
                      ) : (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                          Locked
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>

                    {isActive && (
                      <button
                        onClick={() => setActive(m)}
                        disabled={isCurrent}
                        className="mt-3 rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-background transition disabled:opacity-50"
                      >
                        {isCurrent ? "Currently active" : `Switch to ${meta.title}`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
