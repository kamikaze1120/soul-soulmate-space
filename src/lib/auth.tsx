import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  display_name: string | null;
  verified_gender: "male" | "female" | null;
  marital_status: "single" | "married" | "divorced" | "separated" | "widowed" | null;
  is_verified: boolean;
  primary_mode: "matrimonial" | "sisterhood" | "brotherhood" | null;
};

type Entitlement = {
  mode: "matrimonial" | "sisterhood" | "brotherhood";
  is_active: boolean;
  is_trial: boolean;
  current_period_end: string | null;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  entitlements: Entitlement[];
  isAdmin: boolean;
  isWali: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWali, setIsWali] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (uid: string) => {
    const [{ data: prof }, { data: ents }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, verified_gender, marital_status, is_verified, primary_mode")
        .eq("id", uid)
        .maybeSingle(),
      supabase
        .from("mode_entitlements")
        .select("mode, is_active, is_trial, current_period_end")
        .eq("user_id", uid),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile((prof as Profile) ?? null);
    setEntitlements((ents as Entitlement[]) ?? []);
    const roleSet = new Set((roles ?? []).map((r) => r.role));
    setIsAdmin(roleSet.has("admin"));
    setIsWali(roleSet.has("wali"));
  };

  useEffect(() => {
    // Set up listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // Defer Supabase calls
        setTimeout(() => loadUserData(s.user.id), 0);
      } else {
        setProfile(null);
        setEntitlements([]);
        setIsAdmin(false);
        setIsWali(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadUserData(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refresh = async () => {
    if (user) await loadUserData(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, entitlements, isAdmin, isWali, loading, refresh, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
