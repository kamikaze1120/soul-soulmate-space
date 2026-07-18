import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queries/keys";

// Legacy path: only works if the wali already has an Ummah account (looked
// up by email server-side). Superseded by the invite-link flow below for
// new wali signups, kept for anyone still using the old email-based add.
export function useAddWali(threadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (waliEmail: string) => {
      const { error } = await supabase.rpc("add_wali_to_thread", {
        _thread_id: threadId,
        _wali_email: waliEmail,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads("matrimonial") });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(threadId) });
    },
  });
}

export function useCreateWaliInvite() {
  return useMutation({
    mutationFn: async (threadId: string) => {
      const { data, error } = await supabase.rpc("create_wali_invite", {
        _thread_id: threadId,
      });
      if (error) throw error;
      return data;
    },
  });
}

export type WaliInviteInfo = {
  inviter_name: string | null;
  mode: "matrimonial" | "sisterhood" | "brotherhood";
  expired: boolean;
  redeemed: boolean;
};

export function useWaliInviteInfo(token: string | undefined) {
  return useQuery({
    queryKey: ["wali-invite-info", token] as const,
    enabled: !!token,
    queryFn: async (): Promise<WaliInviteInfo | null> => {
      const { data, error } = await supabase.rpc("get_wali_invite_info", { _token: token! });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}

export function useRedeemWaliInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc("redeem_wali_invite", { _token: token });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
