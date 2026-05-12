import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { MODES, PRICING, visibleModes, type AppMode } from "@/lib/modes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Heart, Users, Lock, Sparkles, BadgeCheck, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Mode Switcher · Ummah" }],
  }),
  component: Dashboard,
});

const MODE_ICONS: Record<AppMode, React.ReactNode> = {
  matrimonial: <Heart className="h-5 w-5" />,
  sisterhood: <Users className="h-5 w-5" />,
  brotherhood: <ShieldCheck className="h-5 w-5" />,
};

type EntitlementState = "active" | "trial" | "locked" | "hidden";

function Dashboard() {
  const { profile, entitlements, signOut } = useAuth();

  const modesView = useMemo(() => {
    const gender = profile?.verified_gender ?? null;
    const visible = visibleModes(gender);
    const entMap = new Map(entitlements.map((e) => [e.mode, e]));

    return (Object.keys(MODES) as AppMode[]).map((m) => {
      if (!visible.includes(m)) return { mode: m, state: "hidden" as EntitlementState, ent: null };
      const ent = entMap.get(m);
      if (ent?.is_active) {
        return { mode: m, state: ent.is_trial ? ("trial" as const) : ("active" as const), ent };
      }
      return { mode: m, state: "locked" as EntitlementState, ent: null };
    });
  }, [profile, entitlements]);

  const activeCount = entitlements.filter((e) => e.is_active).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--gradient-hero)] text-primary-foreground">
              ﷲ
            </span>
            <span>Ummah</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Welcome */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">As-salāmu ʿalaykum,</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              {profile?.display_name ?? "friend"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {profile?.is_verified ? (
              <Badge className="bg-[var(--mode-brotherhood)] text-primary-foreground">
                <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="border-accent text-accent-foreground">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verification pending
              </Badge>
            )}
          </div>
        </div>

        {/* Verification CTA */}
        {!profile?.is_verified && (
          <Card className="mt-6 border-accent/50 bg-[var(--gradient-card)] p-5 shadow-[var(--shadow-gold)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--gradient-gold)] text-accent-foreground">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Verify to unlock gender-locked modes</p>
                  <p className="text-sm text-muted-foreground">
                    Government ID + 3-second Liveness video. Sisterhood and Brotherhood require this.
                  </p>
                </div>
              </div>
              <Button onClick={() => toast.info("Verification flow — coming next iteration (Stripe Identity + liveness upload).")}>
                Start verification
              </Button>
            </div>
          </Card>
        )}

        {/* Mode Switcher */}
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Mode Switcher</h2>
              <p className="text-sm text-muted-foreground">
                {activeCount === 0
                  ? `Start your $${PRICING.trialPrice} 7-day trial on any mode below`
                  : `${activeCount} active mode${activeCount > 1 ? "s" : ""} · Add another for +$${PRICING.addOnPrice}/mo`}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {modesView.map((m) => (
              <ModeCard key={m.mode} mode={m.mode} state={m.state} />
            ))}
          </div>

          {profile?.verified_gender && (
            <p className="mt-4 text-xs text-muted-foreground">
              {profile.verified_gender === "male"
                ? "Sisterhood is hidden — restricted to verified women."
                : "Brotherhood is hidden — restricted to verified men."}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

function ModeCard({ mode, state }: { mode: AppMode; state: EntitlementState }) {
  if (state === "hidden") return null;
  const meta = MODES[mode];
  const tokenBg = `var(--mode-${mode})`;

  if (state === "active" || state === "trial") {
    return (
      <Card className="overflow-hidden border-border bg-[var(--gradient-card)] p-0 shadow-[var(--shadow-soft)]">
        <div className="h-1.5" style={{ background: tokenBg }} />
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-xl text-primary-foreground" style={{ background: tokenBg }}>
              {MODE_ICONS[mode]}
            </div>
            <Badge variant={state === "trial" ? "outline" : "default"}>
              {state === "trial" ? "Trial" : "Active"}
            </Badge>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">{meta.title}</h3>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{meta.tagline}</p>
          <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
          <Button className="mt-5 w-full" onClick={() => toast.info(`Entering ${meta.title} — UI coming next.`)}>
            Enter {meta.title}
          </Button>
        </div>
      </Card>
    );
  }

  // Locked
  return (
    <Card className="relative overflow-hidden border-dashed border-border bg-card p-0">
      <div className="h-1.5 opacity-30" style={{ background: tokenBg }} />
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Lock className="h-5 w-5" />
          </div>
          <Badge variant="outline">Locked</Badge>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{meta.title}</h3>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{meta.tagline}</p>
        <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
        <Button
          variant="outline"
          className="mt-5 w-full"
          onClick={() => toast.info("Stripe checkout — wiring up next iteration.")}
        >
          Unlock for ${PRICING.addOnPrice}/mo
        </Button>
      </div>
    </Card>
  );
}
