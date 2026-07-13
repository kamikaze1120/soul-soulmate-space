import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createVerificationSession } from "@/lib/stripe-identity.server";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/verify")({
  head: () => ({ meta: [{ title: "Verify identity · Ummah" }] }),
  component: VerifyPage,
});

function VerifyPage() {
  const { profile, refresh } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Returning from Stripe's hosted flow — the webhook may not have landed
  // yet (it's async), so this is a best-effort refresh, not a guarantee.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("result") === "return") {
      refresh();
      navigate({ to: "/verify", search: {}, replace: true });
    }
  }, [navigate, refresh]);

  const start = async () => {
    setLoading(true);
    try {
      const { url } = await createVerificationSession();
      window.location.href = url;
    } catch {
      toast.error("Couldn't start verification — try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-6 py-10">
      <Link
        to="/profile"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mt-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--gradient-gold)] text-accent-foreground shadow-[var(--shadow-elevated)]">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h1 className="font-display mt-4 text-2xl font-medium tracking-tight text-foreground">
          Verify your identity
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A government ID + selfie check, handled securely by Stripe. This unlocks Nikah.
        </p>
      </div>

      {profile?.is_verified ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-center text-sm text-foreground shadow-[var(--shadow-soft)]">
          You're verified — Nikah is unlocked.
        </div>
      ) : (
        <button
          onClick={start}
          disabled={loading}
          className="mt-8 w-full rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background transition disabled:opacity-50"
        >
          {loading ? "Redirecting…" : "Start verification"}
        </button>
      )}
    </div>
  );
}
