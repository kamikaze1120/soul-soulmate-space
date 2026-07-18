import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { AppMode } from "./modes";
import { useAuth } from "./auth";
import { eligibleModes } from "./modes";

type Ctx = {
  active: AppMode;
  setActive: (m: AppMode) => void;
  available: AppMode[];
};

const ActiveModeContext = createContext<Ctx | undefined>(undefined);

export function ActiveModeProvider({ children }: { children: ReactNode }) {
  const { profile, entitlements, isAdmin, isWali } = useAuth();
  const available = useMemo(() => {
    const eligible = eligibleModes(
      profile?.verified_gender ?? null,
      profile?.marital_status ?? null,
      profile?.is_verified ?? false,
      isAdmin,
      isWali,
    );
    if (isAdmin) return eligible;
    // A single subscription must be active for a mode to actually be usable
    // — eligibility alone (gender/marital status) is no longer enough.
    const activeModes = new Set(entitlements.filter((e) => e.is_active).map((e) => e.mode));
    return eligible.filter((m) => activeModes.has(m));
  }, [
    profile?.verified_gender,
    profile?.marital_status,
    profile?.is_verified,
    isAdmin,
    isWali,
    entitlements,
  ]);
  const [active, setActive] = useState<AppMode>("matrimonial");

  // Keep active in-bounds
  const safeActive = available.includes(active) ? active : (available[0] ?? "matrimonial");

  return (
    <ActiveModeContext.Provider value={{ active: safeActive, setActive, available }}>
      {children}
    </ActiveModeContext.Provider>
  );
}

export function useActiveMode() {
  const ctx = useContext(ActiveModeContext);
  if (!ctx) throw new Error("useActiveMode must be used within ActiveModeProvider");
  return ctx;
}
