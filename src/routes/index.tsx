import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Heart, Users, BadgeCheck } from "lucide-react";
import { PRICING } from "@/lib/modes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ummah — Verified Muslim Community for Marriage, Moms & Dads" },
      {
        name: "description",
        content:
          "A high-trust Muslim community app with ID-verified members. Matrimonial, Sisterhood (moms), and Brotherhood (dads) modes — strict gender lock and modesty-first design.",
      },
      { property: "og:title", content: "Ummah — Verified Muslim Community" },
      { property: "og:description", content: "ID-verified Matrimonial, Sisterhood & Brotherhood modes." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--gradient-hero)] text-primary-foreground">
              ﷲ
            </span>
            <span className="text-foreground">Ummah</span>
          </Link>
          <Link to="/auth">
            <Button variant="outline">Sign in</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-[var(--shadow-soft)]">
            <BadgeCheck className="h-3.5 w-3.5 text-[var(--mode-brotherhood)]" />
            Government ID + Liveness verified
          </div>
          <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
            A trusted circle for the Ummah
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
            Three private modes — Matrimonial, Sisterhood, and Brotherhood — with strict gender
            lock, ID verification, and modesty-first design. Built for Muslims, by Muslims.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="shadow-[var(--shadow-elevated)]">
                Start ${PRICING.trialPrice} · 7-day trial
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                Already a member
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Then ${PRICING.basePrice}/mo for one mode · +${PRICING.addOnPrice}/mo per added mode
          </p>
        </div>
      </section>

      {/* Modes */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 md:grid-cols-3">
          <ModeCard
            icon={<Heart className="h-5 w-5" />}
            title="Matrimonial"
            tag="Marriage with intention"
            description="Wali-link status, blurred-photo option, and a focus on serious seekers."
            tokenVar="--mode-matrimonial"
          />
          <ModeCard
            icon={<Users className="h-5 w-5" />}
            title="Sisterhood"
            tag="Verified Muslim moms"
            description="Local discovery for moms — kids' age groups, halaqas, and trusted meetups."
            tokenVar="--mode-sisterhood"
          />
          <ModeCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Brotherhood"
            tag="Verified Muslim dads"
            description="Local discovery for dads — mentorship, dawah, and family-friendly gatherings."
            tokenVar="--mode-brotherhood"
          />
        </div>
      </section>
    </div>
  );
}

function ModeCard({
  icon,
  title,
  tag,
  description,
  tokenVar,
}: {
  icon: React.ReactNode;
  title: string;
  tag: string;
  description: string;
  tokenVar: string;
}) {
  return (
    <div
      className="group rounded-2xl border border-border bg-[var(--gradient-card)] p-6 shadow-[var(--shadow-soft)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
    >
      <div
        className="grid h-10 w-10 place-items-center rounded-xl text-primary-foreground"
        style={{ background: `var(${tokenVar})` }}
      >
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{tag}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
