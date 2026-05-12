import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { AppMode } from "./modes";
import { useAuth } from "./auth";
import { visibleModes } from "./modes";

type Ctx = {
  active: AppMode;
  setActive: (m: AppMode) => void;
  available: AppMode[];
};

const ActiveModeContext = createContext<Ctx | undefined>(undefined);

export function ActiveModeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const available = useMemo(
    () => visibleModes(profile?.verified_gender ?? null),
    [profile?.verified_gender],
  );
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
