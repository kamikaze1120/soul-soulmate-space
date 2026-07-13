import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, Users, ShieldCheck, Lock, Sparkles, Check, CreditCard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { MODES, PRICING, visibleModes, type AppMode } from "@/lib/modes";
import { useActiveMode } from "@/lib/active-mode";
import { createCheckoutSession, createBillingPortalSession } from "@/lib/billing.functions";
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
  const { profile, entitlements, isAdmin, refresh } = useAuth();
  const { active, setActive } = useActiveMode();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState<AppMode | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const visible = useMemo(
    () => visibleModes(profile?.verified_gender ?? null, profile?.is_verified ?? false, isAdmin),
    [profile, isAdmin],
  );
  const entMap = new Map(entitlements.map((e) => [e.mode, e]));
  const activeCount = entitlements.filter((e) => e.is_active).length;

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

  const startCheckout = async (mode: AppMode) => {
    setCheckoutLoading(mode);
    try {
      const { url } = await createCheckoutSession({
        data: { mode, hasExistingActiveMode: activeCount > 0 },
      });
      window.location.href = url;
    } catch {
      toast.error("Couldn't start checkout — try again.");
      setCheckoutLoading(null);
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

  return (
    <div className="px-4 pt-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Mode Switcher</h2>
        {activeCount > 0 && (
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
        {activeCount === 0
          ? `Start your $${PRICING.trialPrice} 7-day trial on any unlocked mode below.`
          : `${activeCount} active · Add another for +$${PRICING.addOnPrice}/mo.`}
      </p>

      <div className="mt-5 space-y-3">
        {(Object.keys(MODES) as AppMode[]).map((m) => {
          const meta = MODES[m];
          const isVisible = visible.includes(m);
          const ent = entMap.get(m);
          const isActive = !!ent?.is_active;
          const isCurrent = active === m;

          if (!isVisible) {
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
                        ? "Restricted — complete identity verification to unlock"
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

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {isActive ? (
                        <button
                          onClick={() => setActive(m)}
                          disabled={isCurrent}
                          className="rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-background transition disabled:opacity-50"
                        >
                          {isCurrent ? "Currently active" : `Switch to ${meta.title}`}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => startCheckout(m)}
                            disabled={checkoutLoading !== null}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--mode-matrimonial)] px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {checkoutLoading === m
                              ? "Redirecting…"
                              : activeCount === 0
                                ? `Start trial · $${PRICING.trialPrice}`
                                : `Add for $${PRICING.addOnPrice}/mo`}
                          </button>
                          <span className="text-[11px] text-muted-foreground">
                            then ${PRICING.basePrice}/mo
                          </span>
                        </>
                      )}
                    </div>
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
