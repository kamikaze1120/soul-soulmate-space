import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Users, ShieldCheck } from "lucide-react";
import { useCompleteOnboarding } from "@/lib/queries/profiles";
import { LogoMark } from "@/components/logo-mark";
import type { AppMode } from "@/lib/modes";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome · Ummah" }] }),
  component: OnboardingPage,
});

const GENDER_OPTIONS: {
  value: "male" | "female";
  label: string;
  primaryMode: AppMode;
  icon: React.ReactNode;
}[] = [
  {
    value: "female",
    label: "Female",
    primaryMode: "sisterhood",
    icon: <Users className="h-5 w-5" />,
  },
  {
    value: "male",
    label: "Male",
    primaryMode: "brotherhood",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const complete = useCompleteOnboarding();
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);

  const submit = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) return toast.error("Enter your name.");
    if (!gender) return toast.error("Select whether you're a sister or brother.");
    const primaryMode = gender === "female" ? "sisterhood" : "brotherhood";
    try {
      await complete.mutateAsync({ displayName: trimmed, gender, primaryMode });
      navigate({ to: "/feed" });
    } catch {
      toast.error("Something went wrong — try again.");
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <LogoMark className="mx-auto h-14 w-14 text-2xl shadow-[var(--shadow-elevated)]" />
        <h1 className="font-display mt-4 text-3xl font-medium tracking-tight text-foreground">
          Welcome to Ummah
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          A few details before you begin, in shaa Allah.
        </p>
      </div>

      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Your name
      </label>
      <input
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Display name"
        className="mt-1.5 rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
      />

      <label className="mt-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Gender
      </label>
      <div className="mt-1.5 grid grid-cols-2 gap-3">
        {GENDER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setGender(opt.value)}
            className={`flex flex-col items-center gap-2 rounded-2xl border px-4 py-5 text-sm font-medium transition ${
              gender === opt.value
                ? "border-foreground/60 bg-[var(--gradient-card)]"
                : "border-border bg-card"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        This unlocks Sisterhood/Brotherhood right away. Nikah unlocks after identity verification.
      </p>

      <button
        onClick={submit}
        disabled={complete.isPending}
        className="mt-8 flex items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background transition disabled:opacity-50"
      >
        <Heart className="h-4 w-4" /> {complete.isPending ? "Saving…" : "Continue"}
      </button>
    </div>
  );
}
