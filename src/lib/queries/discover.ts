import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export type NearbyPerson = {
  id: string;
  display_name: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  is_verified: boolean | null;
  distance_miles: number;
  connection_status: "none" | "pending" | "accepted" | "declined";
  avatarUrl: string | null;
};

export function useNearbyProfiles(mode: AppMode, coords: { lat: number; lng: number } | null) {
  return useQuery({
    queryKey: ["nearby", mode, coords?.lat, coords?.lng] as const,
    enabled: !!coords,
    queryFn: async (): Promise<NearbyPerson[]> => {
      const { data, error } = await supabase.rpc("get_nearby_profiles", {
        _mode: mode,
        _lat: coords!.lat,
        _lng: coords!.lng,
      });
      if (error) throw error;

      const avatarUrls = await getSignedUrls(
        "profile-photos",
        (data ?? []).map((p) => p.avatar_path).filter((p): p is string => !!p),
      );

      return (data ?? []).map((p) => ({
        ...p,
        connection_status: (p.connection_status ?? "none") as NearbyPerson["connection_status"],
        avatarUrl: p.avatar_path ? (avatarUrls[p.avatar_path] ?? null) : null,
      }));
    },
  });
}

export function useSaveMyLocation() {
  const { user, refresh } = useAuth();
  return useMutation({
    mutationFn: async (coords: { lat: number; lng: number }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ latitude: coords.lat, longitude: coords.lng })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => refresh(),
  });
}

export function useSendConnectionRequest(mode: AppMode) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recipientId: string) => {
      const { error } = await supabase.rpc("send_connection_request", {
        _recipient_id: recipientId,
        _mode: mode,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nearby"] }),
  });
}

export type IncomingRequest = {
  id: string;
  requester: { id: string; display_name: string | null; avatarUrl: string | null } | null;
  mode: AppMode;
  created_at: string;
};

export function useIncomingConnectionRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["connection-requests", "incoming"] as const,
    enabled: !!user,
    queryFn: async (): Promise<IncomingRequest[]> => {
      const { data: requests, error } = await supabase
        .from("connection_requests")
        .select("id, requester_id, mode, created_at")
        .eq("recipient_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!requests.length) return [];

      const requesterIds = Array.from(new Set(requests.map((r) => r.requester_id)));
      const { data: profiles } = await supabase
        .from("discoverable_profiles")
        .select("id, display_name, avatar_path")
        .in("id", requesterIds);
      const avatarUrls = await getSignedUrls(
        "profile-photos",
        (profiles ?? []).map((p) => p.avatar_path).filter((p): p is string => !!p),
      );
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      return requests.map((r) => {
        const p = profileMap.get(r.requester_id);
        return {
          id: r.id,
          mode: r.mode,
          created_at: r.created_at,
          requester: p
            ? {
                id: p.id!,
                display_name: p.display_name,
                avatarUrl: p.avatar_path ? (avatarUrls[p.avatar_path] ?? null) : null,
              }
            : null,
        };
      });
    },
  });
}

export function useRespondToConnectionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
      const { data, error } = await supabase.rpc("respond_to_connection_request", {
        _request_id: requestId,
        _accept: accept,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection-requests"] });
      queryClient.invalidateQueries({ queryKey: ["nearby"] });
    },
  });
}
