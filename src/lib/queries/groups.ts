import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSignedUrls } from "@/lib/storage";
import { queryKeys } from "@/lib/queries/keys";
import type { AppMode } from "@/lib/modes";
import type { Tables } from "@/integrations/supabase/types";

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mode, title }: { mode: AppMode; title: string }) => {
      const { data, error } = await supabase.rpc("create_group", { _mode: mode, _title: title });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { mode }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.threads(mode) }),
  });
}

export type Connection = Tables<"discoverable_profiles"> & { avatarUrl: string | null };

// A "connection" is anyone the caller already has a DM thread with in this
// mode — see get_connections() in the community_groups migration.
export function useConnections(mode: AppMode, enabled = true) {
  return useQuery({
    queryKey: ["connections", mode] as const,
    enabled,
    queryFn: async (): Promise<Connection[]> => {
      const { data, error } = await supabase.rpc("get_connections", { _mode: mode });
      if (error) throw error;
      const avatarUrls = await getSignedUrls(
        "profile-photos",
        (data ?? []).map((p) => p.avatar_path).filter((p): p is string => !!p),
      );
      return (data ?? []).map((p) => ({
        ...p,
        avatarUrl: p.avatar_path ? (avatarUrls[p.avatar_path] ?? null) : null,
      }));
    },
  });
}

export function useInviteToGroup(mode: AppMode, threadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteeId: string) => {
      const { error } = await supabase.rpc("invite_to_group", {
        _thread_id: threadId,
        _invitee_id: inviteeId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads(mode) });
      queryClient.invalidateQueries({ queryKey: queryKeys.thread(threadId) });
    },
  });
}

export function useToggleGroupCrossGender(mode: AppMode) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ threadId, enabled }: { threadId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("threads")
        .update({ allow_cross_gender: enabled })
        .eq("id", threadId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.threads(mode) }),
  });
}
