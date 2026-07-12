import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getSignedUrls, uploadOwnFile } from "@/lib/storage";
import { queryKeys } from "@/lib/queries/keys";
import type { AppMode } from "@/lib/modes";
import type { Tables } from "@/integrations/supabase/types";

export type FeedPost = Tables<"posts"> & {
  imageUrl: string | null;
  author: (Tables<"discoverable_profiles"> & { avatarUrl: string | null }) | null;
  likeCount: number;
  likedByMe: boolean;
};

export function useFeedPosts(mode: AppMode) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.feed(mode),
    queryFn: async (): Promise<FeedPost[]> => {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .eq("mode", mode)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      if (!posts.length) return [];

      const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
      const [{ data: authors }, { data: likes }, imageUrls] = await Promise.all([
        supabase.from("discoverable_profiles").select("*").in("id", authorIds),
        supabase
          .from("post_likes")
          .select("post_id, user_id")
          .in(
            "post_id",
            posts.map((p) => p.id),
          ),
        getSignedUrls(
          "post-images",
          posts.map((p) => p.image_path),
        ),
      ]);

      const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));
      const avatarUrls = await getSignedUrls(
        "profile-photos",
        (authors ?? []).map((a) => a.avatar_path).filter((p): p is string => !!p),
      );

      return posts.map((post) => {
        const author = authorMap.get(post.author_id) ?? null;
        const postLikes = (likes ?? []).filter((l) => l.post_id === post.id);
        return {
          ...post,
          imageUrl: imageUrls[post.image_path] ?? null,
          author: author
            ? {
                ...author,
                avatarUrl: author.avatar_path ? (avatarUrls[author.avatar_path] ?? null) : null,
              }
            : null,
          likeCount: postLikes.length,
          likedByMe: !!user && postLikes.some((l) => l.user_id === user.id),
        };
      });
    },
  });
}

export function useCreatePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mode, caption, file }: { mode: AppMode; caption: string; file: File }) => {
      if (!user) throw new Error("Not authenticated");
      const imagePath = await uploadOwnFile("post-images", user.id, file);
      const { error } = await supabase
        .from("posts")
        .insert({ author_id: user.id, mode, caption, image_path: imagePath });
      if (error) throw error;
    },
    onSuccess: (_data, { mode }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.feed(mode) }),
  });
}

export function useToggleLike(mode: AppMode) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (liked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.feed(mode) }),
  });
}
