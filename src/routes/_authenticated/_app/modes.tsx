import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Heart, Users, ShieldCheck, Lock, Sparkles, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { MODES, PRICING, visibleModes, type AppMode } from "@/lib/modes";
import { useActiveMode } from "@/lib/active-mode";
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
  const { profile, entitlements } = useAuth();
  const { active, setActive } = useActiveMode();
  const visible = useMemo(() => visibleModes(profile?.verified_gender ?? null), [profile]);
  const entMap = new Map(entitlements.map((e) => [e.mode, e]));
  const activeCount = entitlements.filter((e) => e.is_active).length;

  return (
    <div className="px-4 pt-5">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">Mode Switcher</h2>
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
              <div key={m} className="rounded-2xl border border-dashed border-border bg-card/60 p-4 opacity-70">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{meta.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Restricted — verified {meta.genderLock} only
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
                            onClick={() => toast.info("Stripe checkout coming soon — payments will be wired up next.")}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--mode-matrimonial)] px-4 py-1.5 text-xs font-semibold text-primary-foreground"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {activeCount === 0
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
