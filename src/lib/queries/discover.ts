import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getSignedUrls } from "@/lib/storage";
import { queryKeys } from "@/lib/queries/keys";
import type { AppMode } from "@/lib/modes";
import type { Tables } from "@/integrations/supabase/types";

export type DiscoverPerson = Tables<"discoverable_profiles"> & {
  avatarUrl: string | null;
  coverUrl: string | null;
};

// discoverable_profiles' RLS already only returns rows the viewer shares
// SOME visible mode with; this narrows to people eligible for THIS mode
// specifically (mirrors the can_view_mode() rule for the target row).
export function useDiscoverDeck(mode: AppMode) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.discover(mode),
    queryFn: async (): Promise<DiscoverPerson[]> => {
      let query = supabase.from("discoverable_profiles").select("*").neq("id", user!.id).limit(30);
      if (mode === "matrimonial") query = query.eq("is_verified", true);
      if (mode === "sisterhood") query = query.eq("verified_gender", "female");
      if (mode === "brotherhood") query = query.eq("verified_gender", "male");

      const { data, error } = await query;
      if (error) throw error;

      const avatarUrls = await getSignedUrls(
        "profile-photos",
        (data ?? []).map((p) => p.avatar_path).filter((p): p is string => !!p),
      );
      const coverUrls = await getSignedUrls(
        "profile-photos",
        (data ?? []).map((p) => p.cover_path).filter((p): p is string => !!p),
      );

      return (data ?? []).map((p) => ({
        ...p,
        avatarUrl: p.avatar_path ? (avatarUrls[p.avatar_path] ?? null) : null,
        coverUrl: p.cover_path ? (coverUrls[p.cover_path] ?? null) : null,
      }));
    },
    enabled: !!user,
  });
}
