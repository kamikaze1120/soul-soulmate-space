import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queries/keys";

// Only works if the wali already has an Ummah account (looked up by email
// server-side). No email-invite path for non-users yet — see the migration
// comment on add_wali_to_thread for why that's deferred.
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
