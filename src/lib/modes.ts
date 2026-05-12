export type AppMode = "matrimonial" | "sisterhood" | "brotherhood";
export type Gender = "male" | "female";

export const MODES: Record<AppMode, {
  id: AppMode;
  title: string;
  tagline: string;
  description: string;
  genderLock: Gender | null;
  tokenClass: string;
}> = {
  matrimonial: {
    id: "matrimonial",
    title: "Matrimonial",
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
};

export function visibleModes(gender: Gender | null): AppMode[] {
  const all: AppMode[] = ["matrimonial", "sisterhood", "brotherhood"];
  if (!gender) return ["matrimonial"]; // unverified — only matrimonial visible until verification
  return all.filter((m) => {
    const lock = MODES[m].genderLock;
    return lock === null || lock === gender;
  });
}
