import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Heart, Users, BadgeCheck, ArrowRight } from "lucide-react";
import { PRICING } from "@/lib/modes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ummah — Verified Muslim Community for Marriage, Moms & Dads" },
      {
        name: "description",
        content:
          "A high-trust Muslim community app with ID-verified members. Nikah, Sisterhood (moms), and Brotherhood (dads) — strict gender lock, Wali-friendly, modesty-first.",
      },
      { property: "og:title", content: "Ummah — Verified Muslim Community" },
      { property: "og:description", content: "ID-verified Nikah, Sisterhood & Brotherhood. Wali-friendly." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-[var(--app-canvas)]">
      {/* Nav */}
      <header className="border-b border-border/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--gradient-hero)] text-base font-semibold text-primary-foreground shadow-[var(--shadow-soft)]">
              ﷲ
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight text-foreground">Ummah</span>
          </Link>
          <Link to="/auth">
            <Button variant="ghost" className="font-medium">Sign in</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-40 [background:radial-gradient(60%_50%_at_50%_0%,var(--accent)_0%,transparent_60%)]" />
        <div className="mx-auto max-w-5xl px-6 pt-20 pb-24 text-center md:pt-28 md:pb-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-[var(--shadow-soft)] backdrop-blur">
            <BadgeCheck className="h-3.5 w-3.5 text-[var(--mode-brotherhood)]" />
            Government ID + Liveness verified · Wali-friendly
          </div>

          <h1 className="font-display mt-8 text-balance text-5xl font-medium leading-[1.02] tracking-tight text-foreground md:text-7xl">
            A trusted circle <br className="hidden sm:inline" />
            <span className="italic text-[var(--mode-matrimonial)]">for the Ummah.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground">
            Three private spaces — <span className="text-foreground">Nikah</span>,{" "}
            <span className="text-foreground">Sisterhood</span>, and{" "}
            <span className="text-foreground">Brotherhood</span> — built around strict gender-lock,
            ID verification, and a modesty-first design. Considered. Quiet. Halal-first.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="h-12 gap-2 rounded-full px-6 text-sm font-medium shadow-[var(--shadow-elevated)]">
                Begin your ${PRICING.trialPrice} · 7-day trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="h-12 rounded-full border-border bg-card/60 px-6 text-sm font-medium backdrop-blur">
                Already a member
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            then ${PRICING.basePrice}/mo per mode · add-on ${PRICING.addOnPrice}/mo
          </p>
        </div>
      </section>

      <div className="hairline mx-auto max-w-5xl" />

      {/* Modes — editorial cards */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mb-12 text-center">
          <p className="eyebrow text-muted-foreground">Three modes · One identity</p>
          <h2 className="font-display mt-3 text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Choose your circle.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <ModeCard
            number="01"
            icon={<Heart className="h-5 w-5" />}
            title="Nikah"
            tag="Marriage with intention"
            description="Wali-link status, blurred-photo option, group conversations with a guardian present. For serious seekers."
            tokenVar="--mode-matrimonial"
          />
          <ModeCard
            number="02"
            icon={<Users className="h-5 w-5" />}
            title="Sisterhood"
            tag="Verified Muslim moms"
            description="A private circle for verified mothers — local meetups, kids' age groups, halaqas, trusted advice."
            tokenVar="--mode-sisterhood"
          />
          <ModeCard
            number="03"
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Brotherhood"
            tag="Verified Muslim dads"
            description="A trusted space for fathers — mentorship, family gatherings, dawah, and accountability."
            tokenVar="--mode-brotherhood"
          />
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-[var(--gradient-card)] border-y border-border/50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-12 md:grid-cols-3">
            <Pillar n="ID + Liveness" body="Every member passes a government-ID check and a 3-second liveness video. No catfishing." />
            <Pillar n="Strict gender-lock" body="Sisterhood and Brotherhood are invisible to the opposite gender. By design." />
            <Pillar n="Wali-friendly chats" body="A sister can promote any Nikah DM to a group with her wali in one tap." />
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-12 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Ummah · Built for the Muslim community.
      </footer>
    </div>
  );
}

function ModeCard({
  number,
  icon,
  title,
  tag,
  description,
  tokenVar,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  tag: string;
  description: string;
  tokenVar: string;
}) {
  return (
    <article className="group relative overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card p-8 shadow-[var(--shadow-soft)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]">
      <div className="absolute right-6 top-6 font-display text-3xl font-light text-muted-foreground/40">
        {number}
      </div>
      <div
        className="grid h-11 w-11 place-items-center rounded-full text-primary-foreground shadow-[var(--shadow-soft)]"
        style={{ background: `var(${tokenVar})` }}
      >
        {icon}
      </div>
      <h3 className="font-display mt-6 text-3xl font-medium tracking-tight text-foreground">{title}</h3>
      <p className="eyebrow mt-1 text-muted-foreground">{tag}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-6 h-px w-12 bg-[var(--accent)]" />
    </article>
  );
}

function Pillar({ n, body }: { n: string; body: string }) {
  return (
    <div>
      <h3 className="font-display text-2xl font-medium tracking-tight text-foreground">{n}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
