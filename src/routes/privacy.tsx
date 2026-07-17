import { createFileRoute, Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/logo-mark";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy · Ummah" }] }),
  component: PrivacyPage,
});

const LAST_UPDATED = "July 17, 2026";

function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <p>
              Ummah ("we," "us," "our") operates the Ummah app and website (the "Service"). This
              policy explains what information we collect, why, and how it's handled. By using
              Ummah, you agree to this policy.
            </p>
          </section>

          <Section title="Information we collect">
            <p className="font-medium text-foreground">Account &amp; profile information</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Email address and password (authentication is handled by Supabase Auth)</li>
              <li>Display name and self-reported gender</li>
              <li>Profile photos you upload</li>
              <li>Approximate location, if you choose to provide it, for local matching/meetups</li>
              <li>Messages you send within the app</li>
              <li>
                For members who choose to bring a marriage guardian (wali) into a conversation:
                the wali's contact information you provide
              </li>
            </ul>

            <p className="mt-4 font-medium text-foreground">Identity verification</p>
            <p className="mt-2">
              To unlock the Nikah (matrimonial) mode, members complete identity verification
              through <strong>Stripe Identity</strong>. This involves uploading a government-issued
              ID and a selfie. That document and selfie are processed directly by Stripe — Ummah
              does not receive or store your raw ID image. We only receive and store the result: a
              yes/no verification status.
            </p>

            <p className="mt-4 font-medium text-foreground">Payment information</p>
            <p className="mt-2">
              Subscriptions are billed through <strong>Stripe</strong>. Ummah never receives or
              stores your full card number — Stripe handles payment processing and stores payment
              methods on our behalf under its own security standards.
            </p>
          </Section>

          <Section title="How we use your information">
            <ul className="list-disc space-y-1 pl-5">
              <li>To create and secure your account, and authenticate you at sign-in</li>
              <li>
                To enforce our core safety rule: Sisterhood and Brotherhood are only ever shown to
                members of the matching self-reported gender; Nikah is only unlocked after identity
                verification
              </li>
              <li>To operate messaging, posts, and community features within the app</li>
              <li>To process subscription payments and manage your billing</li>
              <li>To review reports of abuse or policy violations and keep the community safe</li>
              <li>To communicate with you about your account or the Service</li>
            </ul>
          </Section>

          <Section title="Who we share information with">
            <p>
              We do not sell your personal information. We share data only with the service
              providers that run the app on our behalf:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Supabase</strong> — database, authentication, and file storage
              </li>
              <li>
                <strong>Stripe</strong> — payment processing and identity verification
              </li>
              <li>
                <strong>Cloudflare</strong> — application hosting
              </li>
            </ul>
            <p className="mt-2">
              Other members can see the profile information associated with modes you're visible
              in (display name, photo, and profile details you choose to share). We do not expose
              your exact location, wali contact information, or verification documents to other
              members.
            </p>
          </Section>

          <Section title="Your choices">
            <ul className="list-disc space-y-1 pl-5">
              <li>You can edit your profile information at any time from within the app.</li>
              <li>
                You can request deletion of your account and associated data by emailing{" "}
                <a className="underline" href="mailto:info@saber-holdings.com">
                  info@saber-holdings.com
                </a>
                . We will process deletion requests within a reasonable time, except where we're
                required to retain limited records for legal, safety, or fraud-prevention reasons.
              </li>
            </ul>
          </Section>

          <Section title="Children">
            <p>
              Ummah is intended for adults 18 and older. We do not knowingly collect information
              from anyone under 18. See our{" "}
              <Link to="/child-safety" className="underline">
                Child Safety Standards
              </Link>{" "}
              for more.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about this policy or your data can be sent to{" "}
              <a className="underline" href="mailto:info@saber-holdings.com">
                info@saber-holdings.com
              </a>
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
