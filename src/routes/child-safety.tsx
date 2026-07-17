import { createFileRoute, Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/logo-mark";

export const Route = createFileRoute("/child-safety")({
  head: () => ({ meta: [{ title: "Child Safety Standards · Ummah" }] }),
  component: ChildSafetyPage,
});

const LAST_UPDATED = "July 17, 2026";

function ChildSafetyPage() {
  return (
    <div className="min-h-screen bg-[var(--app-canvas)]">
      <header className="border-b border-border/50">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8 text-sm" />
            <span className="font-display text-xl font-semibold tracking-tight text-foreground">
              Ummah
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="font-display text-4xl font-medium tracking-tight text-foreground">
          Child Safety Standards
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <p>
              Ummah is an adults-only community app. We have zero tolerance for child sexual abuse
              and exploitation (CSAE) of any kind, and for any content or behavior that endangers
              minors.
            </p>
          </section>

          <Section title="Age restriction">
            <p>
              Ummah is restricted to members 18 years of age and older. We enforce this using
              Google Play's declared-age account controls to block access by accounts declared as
              minors, in addition to requiring government-ID-based identity verification to unlock
              our matrimonial (Nikah) mode.
            </p>
          </Section>

          <Section title="Zero tolerance">
            <p>We prohibit, and will act immediately on any report of:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Any sexual content involving, or appearing to involve, a minor</li>
              <li>Grooming, solicitation, or any attempt to contact or exploit a minor</li>
              <li>Any account found to belong to, or be operated by, a minor</li>
            </ul>
          </Section>

          <Section title="Reporting">
            <p>
              Any member can report a profile, message, or post directly within the app. Reports
              are reviewed by our moderation team. Concerns can also be sent directly to our
              designated safety point of contact:
            </p>
            <p className="mt-3 rounded-lg border border-border bg-card px-4 py-3 font-medium text-foreground">
              info@saber-holdings.com
            </p>
          </Section>

          <Section title="Our response">
            <p>
              Upon receiving a report involving suspected CSAE, we will immediately restrict the
              reported account's access pending investigation, remove violating content, and
              report to the National Center for Missing &amp; Exploited Children (NCMEC) and/or
              relevant law enforcement as required by applicable law.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about these standards can be sent to{" "}
              <a className="underline" href="mailto:info@saber-holdings.com">
                info@saber-holdings.com
              </a>
              . See also our{" "}
              <Link to="/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-medium tracking-tight text-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
