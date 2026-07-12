import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getSignedUrls } from "@/lib/storage";
import { queryKeys } from "@/lib/queries/keys";
import type { AppMode } from "@/lib/modes";
import type { Tables } from "@/integrations/supabase/types";

type MemberProfile = Tables<"discoverable_profiles"> & { avatarUrl: string | null };

export type ThreadSummary = Tables<"threads"> & {
  members: MemberProfile[];
  otherMembers: MemberProfile[];
  lastMessage: Tables<"messages"> | null;
};

// No read-tracking table exists yet, so there's no real "unread" count —
// deliberately simplified vs. the old mock data (which faked one).
export function useThreads(mode: AppMode) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.threads(mode),
    queryFn: async (): Promise<ThreadSummary[]> => {
      const { data: memberships, error: membershipError } = await supabase
        .from("thread_members")
        .select("thread_id")
        .eq("user_id", user!.id);
      if (membershipError) throw membershipError;
      const threadIds = (memberships ?? []).map((m) => m.thread_id);
      if (threadIds.length === 0) return [];

      const { data: threads, error: threadsError } = await supabase
        .from("threads")
        .select("*")
        .eq("mode", mode)
        .in("id", threadIds)
        .order("updated_at", { ascending: false });
      if (threadsError) throw threadsError;
      if (!threads.length) return [];

      const { data: allMembers, error: allMembersError } = await supabase
        .from("thread_members")
        .select("thread_id, user_id")
        .in(
          "thread_id",
          threads.map((t) => t.id),
        );
      if (allMembersError) throw allMembersError;

      const memberIds = Array.from(new Set((allMembers ?? []).map((m) => m.user_id)));
      const { data: profiles, error: profilesError } = await supabase
        .from("discoverable_profiles")
        .select("*")
        .in("id", memberIds);
      if (profilesError) throw profilesError;

      const avatarUrls = await getSignedUrls(
        "profile-photos",
        (profiles ?? []).map((p) => p.avatar_path).filter((p): p is string => !!p),
      );
      const profileMap = new Map(
        (profiles ?? []).map((p) => [
          p.id,
          { ...p, avatarUrl: p.avatar_path ? (avatarUrls[p.avatar_path] ?? null) : null },
        ]),
      );

      const { data: lastMessages, error: lastMessagesError } = await supabase
        .from("messages")
        .select("*")
        .in(
          "thread_id",
          threads.map((t) => t.id),
        )
        .order("created_at", { ascending: false });
      if (lastMessagesError) throw lastMessagesError;

      return threads.map((thread) => {
        const memberIdsForThread = (allMembers ?? [])
          .filter((m) => m.thread_id === thread.id)
          .map((m) => m.user_id);
        const members = memberIdsForThread
          .map((id) => profileMap.get(id))
          .filter((m): m is MemberProfile => !!m);
        return {
          ...thread,
          members,
          otherMembers: members.filter((m) => m.id !== user!.id),
          lastMessage: (lastMessages ?? []).find((msg) => msg.thread_id === thread.id) ?? null,
        };
      });
    },
    enabled: !!user,
  });
}

export function useStartDmThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ otherUserId, mode }: { otherUserId: string; mode: AppMode }) => {
      const { data, error } = await supabase.rpc("start_dm_thread", {
        _other_user_id: otherUserId,
        _mode: mode,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { mode }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.threads(mode) }),
  });
}
