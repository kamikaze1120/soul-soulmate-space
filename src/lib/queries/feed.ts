import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getSignedUrls, uploadOwnFile } from "@/lib/storage";
import { queryKeys } from "@/lib/queries/keys";
import type { AppMode } from "@/lib/modes";
import type { Tables } from "@/integrations/supabase/types";

export type PostType = "photo" | "event" | "poll";

export type PollOption = Tables<"poll_options"> & { voteCount: number };

export type FeedPost = Tables<"posts"> & {
  imageUrl: string | null;
  author: (Tables<"discoverable_profiles"> & { avatarUrl: string | null }) | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  pollOptions: PollOption[];
  myVoteOptionId: string | null;
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

      const postIds = posts.map((p) => p.id);
      const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
      const [
        { data: authors },
        { data: likes },
        { data: comments },
        { data: options },
        { data: votes },
        imageUrls,
      ] = await Promise.all([
        supabase.from("discoverable_profiles").select("*").in("id", authorIds),
        supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds),
        supabase.from("post_comments").select("post_id").in("post_id", postIds),
        supabase.from("poll_options").select("*").in("post_id", postIds).order("position"),
        supabase.from("poll_votes").select("post_id, option_id, user_id").in("post_id", postIds),
        getSignedUrls(
          "post-images",
          posts.map((p) => p.image_path).filter((p): p is string => !!p),
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
        const postVotes = (votes ?? []).filter((v) => v.post_id === post.id);
        const myVote = postVotes.find((v) => !!user && v.user_id === user.id);
        const postOptions = (options ?? [])
          .filter((o) => o.post_id === post.id)
          .map((o) => ({ ...o, voteCount: postVotes.filter((v) => v.option_id === o.id).length }));

        return {
          ...post,
          imageUrl: post.image_path ? (imageUrls[post.image_path] ?? null) : null,
          author: author
            ? {
                ...author,
                avatarUrl: author.avatar_path ? (avatarUrls[author.avatar_path] ?? null) : null,
              }
            : null,
          likeCount: postLikes.length,
          likedByMe: !!user && postLikes.some((l) => l.user_id === user.id),
          commentCount: (comments ?? []).filter((c) => c.post_id === post.id).length,
          pollOptions: postOptions,
          myVoteOptionId: myVote?.option_id ?? null,
        };
      });
    },
  });
}

type CreatePostInput =
  | { mode: AppMode; type: "photo"; caption: string; file: File }
  | {
      mode: AppMode;
      type: "event";
      caption: string;
      eventAt: string;
      eventLocation: string;
      file?: File;
    }
  | { mode: AppMode; type: "poll"; caption: string; options: string[] };

export function useCreatePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      if (!user) throw new Error("Not authenticated");

      let imagePath: string | null = null;
      if (input.type === "photo") {
        imagePath = await uploadOwnFile("post-images", user.id, input.file);
      } else if (input.type === "event" && input.file) {
        imagePath = await uploadOwnFile("post-images", user.id, input.file);
      }

      const { error } = await supabase.rpc("create_post", {
        _mode: input.mode,
        _post_type: input.type,
        _caption: input.caption,
        _image_path: imagePath ?? undefined,
        _event_at: input.type === "event" ? input.eventAt : undefined,
        _event_location: input.type === "event" ? input.eventLocation : undefined,
        _poll_options: input.type === "poll" ? input.options : undefined,
      });
      if (error) throw error;
    },
    onSuccess: (_data, input) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.feed(input.mode) }),
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

export function useVoteOnPoll(mode: AppMode) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, optionId }: { postId: string; optionId: string }) => {
      const { error } = await supabase.rpc("vote_on_poll", {
        _post_id: postId,
        _option_id: optionId,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.feed(mode) }),
  });
}
