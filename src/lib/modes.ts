export type AppMode = "matrimonial" | "sisterhood" | "brotherhood";
export type Gender = "male" | "female";
export type MaritalStatus = "single" | "married" | "divorced" | "separated" | "widowed";

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

// A single flat subscription now covers every mode a member is eligible
// for — there's no more per-mode add-on price.
export const PRICING = {
  basePrice: 10.99,
  trialPrice: 2.99,
  trialDays: 7,
};

// Eligibility only — separate from whether they've actually subscribed.
// Mirrors can_view_mode()'s eligibility half exactly (the DB function
// additionally requires an active mode_entitlements row on top of this,
// which active-mode.tsx/modes.tsx layer on via the entitlements list).
// Nothing is eligible before ID verification — that's a universal gate now,
// not just a Nikah-specific one. Admins bypass everything; wali accounts
// are eligible for nothing (they only ever see the thread(s) they were
// invited into, gated separately by thread membership).
export function eligibleModes(
  gender: Gender | null,
  maritalStatus: MaritalStatus | null,
  isVerified: boolean,
  isAdmin = false,
  isWali = false,
): AppMode[] {
  if (isAdmin) return ["matrimonial", "sisterhood", "brotherhood"];
  if (isWali || !isVerified) return [];
  const modes: AppMode[] = [];
  if (gender === "female") modes.push("sisterhood");
  if (gender === "male") modes.push("brotherhood");
  if (maritalStatus && maritalStatus !== "married") modes.push("matrimonial");
  return modes;
}
