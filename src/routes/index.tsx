import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Heart, Users, BadgeCheck, ArrowRight } from "lucide-react";
import { PRICING } from "@/lib/modes";
import { LogoMark } from "@/components/logo-mark";
import heroPattern from "@/assets/hero-pattern.png";
import modeMatrimonial from "@/assets/mode-matrimonial.png";
import modeSisterhood from "@/assets/mode-sisterhood.png";
import modeBrotherhood from "@/assets/mode-brotherhood.png";

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
      {
        property: "og:description",
        content: "ID-verified Nikah, Sisterhood & Brotherhood. Wali-friendly.",
      },
    ],
  }),
  component: Landing,
});

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--app-canvas)]">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-border/50 bg-[var(--app-canvas)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9 text-base" />
            <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Ummah
            </span>
          </Link>
          <Link to="/auth">
            <Button variant="ghost" className="font-medium">
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroPattern}
            alt=""
            className="h-full w-full object-cover opacity-[0.16]"
            aria-hidden
          />
          <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_0%,transparent_0%,var(--app-canvas)_75%)]" />
        </div>

        <div className="mx-auto max-w-5xl px-6 pt-20 pb-24 text-center md:pt-28 md:pb-32">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-[var(--shadow-soft)] backdrop-blur"
          >
            <BadgeCheck className="h-3.5 w-3.5 text-[var(--mode-brotherhood)]" />
            Government ID + selfie verified · Wali-friendly
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.08, ease: "easeOut" }}
            className="font-display mt-8 text-balance text-5xl font-medium leading-[1.02] tracking-tight text-foreground md:text-7xl"
          >
            A trusted circle <br className="hidden sm:inline" />
            <span className="italic text-[var(--mode-matrimonial)]">for the Ummah.</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.16, ease: "easeOut" }}
            className="mx-auto mt-7 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground"
          >
            Three private spaces — <span className="text-foreground">Nikah</span>,{" "}
            <span className="text-foreground">Sisterhood</span>, and{" "}
            <span className="text-foreground">Brotherhood</span> — built around strict gender-lock,
            ID verification, and a modesty-first design. Considered. Quiet. Halal-first.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.24, ease: "easeOut" }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/auth">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-full px-6 text-sm font-medium shadow-[var(--shadow-elevated)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                Begin your ${PRICING.trialPrice} · 7-day trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-border bg-card/60 px-6 text-sm font-medium backdrop-blur transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                Already a member
              </Button>
            </Link>
          </motion.div>
          <p className="mt-4 text-xs text-muted-foreground">
            then ${PRICING.basePrice}/mo — covers every mode you're eligible for
          </p>
        </div>
      </section>

      <div className="hairline mx-auto max-w-5xl" />

      {/* Modes — editorial cards */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <p className="eyebrow text-muted-foreground">Three modes · One identity</p>
          <h2 className="font-display mt-3 text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Choose your circle.
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          <ModeCard
            number="01"
            icon={<Heart className="h-5 w-5" />}
            title="Nikah"
            tag="Marriage with intention"
            description="Wali-link status, blurred-photo option, group conversations with a guardian present. For serious seekers."
            tokenVar="--mode-matrimonial"
            image={modeMatrimonial}
            delay={0}
          />
          <ModeCard
            number="02"
            icon={<Users className="h-5 w-5" />}
            title="Sisterhood"
            tag="Verified Muslim moms"
            description="A private circle for verified mothers — local meetups, kids' age groups, halaqas, trusted advice."
            tokenVar="--mode-sisterhood"
            image={modeSisterhood}
            delay={0.1}
          />
          <ModeCard
            number="03"
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Brotherhood"
            tag="Verified Muslim dads"
            description="A trusted space for fathers — mentorship, family gatherings, dawah, and accountability."
            tokenVar="--mode-brotherhood"
            image={modeBrotherhood}
            delay={0.2}
          />
        </div>
      </section>

      {/* Pillars */}
      <section className="relative overflow-hidden border-y border-border/50 bg-[var(--gradient-card)] py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-12 md:grid-cols-3">
            <Pillar
              n="ID + Selfie"
              body="Every member passes a government-ID check and a selfie match via Stripe Identity. No catfishing."
              delay={0}
            />
            <Pillar
              n="Strict gender-lock"
              body="Sisterhood and Brotherhood are invisible to the opposite gender. By design."
              delay={0.1}
            />
            <Pillar
              n="Wali-friendly chats"
              body="A sister can promote any Nikah DM to a group with her wali in one tap."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-12 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Ummah · Built for the Muslim community.
        <div className="mt-2 flex items-center justify-center gap-4">
          <Link to="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          <Link to="/child-safety" className="underline hover:text-foreground">
            Child Safety Standards
          </Link>
        </div>
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
  image,
  delay,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  tag: string;
  description: string;
  tokenVar: string;
  image: string;
  delay: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="relative h-28 w-full overflow-hidden">
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          aria-hidden
        />
        <div
          className="absolute inset-0 mix-blend-multiply"
          style={{ background: `var(${tokenVar})`, opacity: 0.35 }}
        />
        <div className="absolute right-4 top-4 font-display text-3xl font-light text-white/50">
          {number}
        </div>
      </div>
      <div className="p-8 pt-6">
        <div
          className="-mt-14 grid h-11 w-11 place-items-center rounded-full text-primary-foreground shadow-[var(--shadow-soft)]"
          style={{ background: `var(${tokenVar})` }}
        >
          {icon}
        </div>
        <h3 className="font-display mt-5 text-3xl font-medium tracking-tight text-foreground">
          {title}
        </h3>
        <p className="eyebrow mt-1 text-muted-foreground">{tag}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-6 h-px w-12 bg-[var(--accent)] transition-all duration-300 group-hover:w-20" />
      </div>
    </motion.article>
  );
}

function Pillar({ n, body, delay }: { n: string; body: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
    >
      <h3 className="font-display text-2xl font-medium tracking-tight text-foreground">{n}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </motion.div>
  );
}
