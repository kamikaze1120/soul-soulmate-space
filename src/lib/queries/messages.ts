import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queries/keys";
import type { Tables } from "@/integrations/supabase/types";

export function useMessages(threadId: string) {
  return useQuery({
    queryKey: queryKeys.messages(threadId),
    queryFn: async (): Promise<Tables<"messages">[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!threadId,
  });
}

export function useSendMessage(threadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const { data, error } = await supabase.rpc("send_message", {
        _thread_id: threadId,
        _body: body,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.messages(threadId) }),
  });
}
