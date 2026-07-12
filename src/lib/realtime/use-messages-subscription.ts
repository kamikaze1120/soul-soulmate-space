import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queries/keys";

export function useMessagesSubscription(threadId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`messages:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: queryKeys.messages(threadId) }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, queryClient]);
}
