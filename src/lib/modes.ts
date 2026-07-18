export type AppMode = "matrimonial" | "sisterhood" | "brotherhood";
export type Gender = "male" | "female";

export const MODES: Record<
  AppMode,
  {
    id: AppMode;
    title: string;
    tagline: string;
    description: string;
    genderLock: Gender | null;
    tokenClass: string;
  }
> = {
  matrimonial: {
    id: "matrimonial",
    title: "Nikah",
    tagline: "Marriage with intention",
    description: "Connect with verified Muslims seeking marriage. Wali-friendly, modesty-first.",
    genderLock: null,
    tokenClass: "matrimonial",
  },
  sisterhood: {
    id: "sisterhood",
    title: "Sisterhood",
    tagline: "Moms only · Verified women",
    description: "A private circle for verified Muslim mothers. Local meetups, advice, halaqas.",
    genderLock: "female",
    tokenClass: "sisterhood",
  },
  brotherhood: {
    id: "brotherhood",
    title: "Brotherhood",
    tagline: "Dads only · Verified men",
    description: "A trusted space for verified Muslim fathers. Local meetups, mentorship, dawah.",
    genderLock: "male",
    tokenClass: "brotherhood",
  },
};

export const PRICING = {
  basePrice: 10.99,
  addOnPrice: 5.99,
  trialPrice: 2.99,
  trialDays: 7,
  // Wali accounts: 14 free days (granted at invite redemption, not through
  // Stripe), then a flat $4.99/mo — cheaper than a full member since their
  // access is read/comment-only in a single gender-locked mode.
  waliPrice: 4.99,
  waliTrialDays: 14,
};

// Nikah (matrimonial) is the highest-stakes mode — opposite-gender matching,
// wali involvement — so it stays locked until Stripe Identity verification.
// Sisterhood/Brotherhood are peer-community spaces, gender-gated only.
// Admins bypass all of this (mirrors the can_view_mode() DB function) so a
// single seed/admin account can post across every mode. Wali accounts get
// no free gender-based access at all — mirrors can_view_mode()'s wali
// carve-out — their mode access always comes from an active entitlement
// (the 14-day trial granted at invite redemption, then a paid sub), which
// active-mode.tsx layers on top of this via the entitlements list.
export function visibleModes(
  gender: Gender | null,
  isVerified: boolean,
  isAdmin = false,
  isWali = false,
): AppMode[] {
  if (isAdmin) return ["matrimonial", "sisterhood", "brotherhood"];
  if (isWali) return [];
  const modes: AppMode[] = [];
  if (isVerified) modes.push("matrimonial");
  if (gender === "female") modes.push("sisterhood");
  if (gender === "male") modes.push("brotherhood");
  return modes;
}
