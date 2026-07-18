import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getSignedUrls } from "@/lib/storage";
import { queryKeys } from "@/lib/queries/keys";
import type { AppMode } from "@/lib/modes";
import type { Tables } from "@/integrations/supabase/types";

export type PostComment = Tables<"post_comments"> & {
  author: (Tables<"discoverable_profiles"> & { avatarUrl: string | null }) | null;
};

export function useComments(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.comments(postId),
    enabled,
    queryFn: async (): Promise<PostComment[]> => {
      const { data: comments, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (!comments.length) return [];

      const authorIds = Array.from(new Set(comments.map((c) => c.author_id)));
      const { data: authors } = await supabase
        .from("discoverable_profiles")
        .select("*")
        .in("id", authorIds);
      const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));
      const avatarUrls = await getSignedUrls(
        "profile-photos",
        (authors ?? []).map((a) => a.avatar_path).filter((p): p is string => !!p),
      );

      return comments.map((c) => {
        const author = authorMap.get(c.author_id) ?? null;
        return {
          ...c,
          author: author
            ? {
                ...author,
                avatarUrl: author.avatar_path ? (avatarUrls[author.avatar_path] ?? null) : null,
              }
            : null,
        };
      });
    },
  });
}

export function useAddComment(mode: AppMode, postId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      if (!user) throw new Error("Not authenticated");
      const trimmed = body.trim();
      if (!trimmed) throw new Error("Comment can't be empty");
      const { error } = await supabase
        .from("post_comments")
        .insert({ post_id: postId, author_id: user.id, body: trimmed });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed(mode) });
    },
  });
}
