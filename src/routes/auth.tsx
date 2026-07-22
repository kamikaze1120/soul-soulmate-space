import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { LogoMark } from "@/components/logo-mark";
import heroPattern from "@/assets/hero-pattern.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Ummah" },
      { name: "description", content: "Sign in or create your verified Ummah account." },
    ],
  }),
  component: AuthPage,
});

// === Validation schemas (defense in depth — server enforces too) ===
const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .max(72, "Too long")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[a-z]/, "Add a lowercase letter")
    .regex(/[0-9]/, "Add a number"),
  gender: z.enum(["male", "female"], { message: "Select your gender" }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Redirect if already signed in — use getUser() (revalidates) per security guidance
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) navigate({ to: "/feed" });
    });
  }, [navigate]);

  const [siEmail, setSiEmail] = useState("");
  const [siPass, setSiPass] = useState("");

  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPass, setSuPass] = useState("");
  const [suGender, setSuGender] = useState<"male" | "female" | "">("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email: siEmail, password: siPass });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/feed" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({
      name: suName,
      email: suEmail,
      password: suPass,
      gender: suGender || undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin + "/feed",
        data: { display_name: parsed.data.name, gender: parsed.data.gender },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — check your email to verify.");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--app-canvas)]">
      <img
        src={heroPattern}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] w-full object-cover opacity-[0.1]"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(70%_60%_at_50%_0%,transparent_0%,var(--app-canvas)_80%)]" />

      {/* Editorial header */}
      <div className="relative mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <Link to="/" className="flex items-center gap-2">
          <LogoMark className="h-8 w-8 text-sm" />
          <span className="font-display text-xl font-semibold tracking-tight text-foreground">
            Ummah
          </span>
        </Link>
      </div>

      <div className="relative mx-auto grid max-w-5xl gap-10 px-6 pb-20 pt-8 md:grid-cols-2 md:items-center">
        {/* Left: editorial copy */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="hidden md:block"
        >
          <p className="eyebrow text-muted-foreground">Members only</p>
          <h1 className="font-display mt-3 text-5xl font-medium leading-[1.05] tracking-tight text-foreground">
            Step inside a <span className="italic text-[var(--mode-matrimonial)]">verified</span>{" "}
            circle.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Every member is checked against a government ID and a selfie match before they can be
            discovered. Modesty-first by design.
          </p>
          <div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-[var(--mode-brotherhood)]" />
            Your credentials are encrypted in transit and at rest.
          </div>
        </motion.div>

        {/* Right: form card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="rounded-[var(--radius-2xl)] border border-border bg-card p-7 shadow-[var(--shadow-elevated)] md:p-9"
        >
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted p-1">
              <TabsTrigger value="signin" className="rounded-full">
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full">
                Create account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4" autoComplete="on">
                <Field
                  id="si-email"
                  name="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={siEmail}
                  onChange={setSiEmail}
                />
                <Field
                  id="si-pass"
                  name="password"
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  value={siPass}
                  onChange={setSiPass}
                />
                <Button
                  type="submit"
                  className="h-11 w-full rounded-full text-sm font-medium"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  Tip: if sign-in stalls in the Lovable preview, use the published URL.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4" autoComplete="on">
                <Field
                  id="su-name"
                  name="name"
                  label="Display name"
                  autoComplete="name"
                  value={suName}
                  onChange={setSuName}
                />
                <Field
                  id="su-email"
                  name="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={suEmail}
                  onChange={setSuEmail}
                />
                <Field
                  id="su-pass"
                  name="new-password"
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  value={suPass}
                  onChange={setSuPass}
                  hint="8+ chars · upper, lower, number"
                />
                <div className="space-y-2">
                  <Label className="eyebrow text-muted-foreground">
                    Gender · required for verification
                  </Label>
                  <RadioGroup
                    value={suGender}
                    onValueChange={(v) => setSuGender(v as "male" | "female")}
                    className="grid grid-cols-2 gap-2"
                  >
                    <Label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background p-3 text-sm hover:bg-muted">
                      <RadioGroupItem value="male" /> Male
                    </Label>
                    <Label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background p-3 text-sm hover:bg-muted">
                      <RadioGroupItem value="female" /> Female
                    </Label>
                  </RadioGroup>
                  <p className="text-[11px] text-muted-foreground">
                    Confirmed by ID + selfie check — required before anything unlocks.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full rounded-full text-sm font-medium"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  hint,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="eyebrow text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border-border bg-background"
      />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
