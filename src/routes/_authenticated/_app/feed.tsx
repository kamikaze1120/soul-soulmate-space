import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  BadgeCheck,
  MoreHorizontal,
  Flag,
  CalendarDays,
  MapPin,
  Check,
} from "lucide-react";
import { useActiveMode } from "@/lib/active-mode";
import { useFeedPosts, useToggleLike, useVoteOnPoll, type FeedPost } from "@/lib/queries/feed";
import { useCreateReport } from "@/lib/queries/reports";
import { ModeBadge } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { CreatePostSheet } from "@/components/create-post-sheet";
import { CommentsSheet } from "@/components/comments-sheet";
import { MODES } from "@/lib/modes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/feed")({
  head: () => ({ meta: [{ title: "Feed · Ummah" }] }),
  component: FeedPage,
});

function FeedPage() {
  const { active } = useActiveMode();
  const meta = MODES[active];
  const { data: posts, isLoading } = useFeedPosts(active);
  const toggleLike = useToggleLike(active);
  const voteOnPoll = useVoteOnPoll(active);
  const createReport = useCreateReport();
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const reportPost = async (postId: string) => {
    try {
      await createReport.mutateAsync({
        target_type: "post",
        target_id: postId,
        reason: "Reported from feed",
        details: "",
      });
      toast.success("Report submitted — thank you.");
    } catch {
      toast.error("Couldn't submit report.");
    }
  };

  return (
    <div>
      <div className="px-5 pt-6 pb-3">
        <p className="eyebrow text-muted-foreground">Today · {meta.tagline}</p>
        <h2 className="font-display mt-1 text-3xl font-medium tracking-tight text-foreground">
          {meta.title}
        </h2>
      </div>

      <div className="space-y-5 py-5">
        {!isLoading && (!posts || posts.length === 0) && (
          <EmptyState
            title="No posts yet"
            description={`Nothing shared in ${meta.title} yet. Check back soon, in shaa Allah.`}
          />
        )}
        {posts?.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={() => toggleLike.mutate({ postId: post.id, liked: post.likedByMe })}
            onVote={(optionId) => voteOnPoll.mutate({ postId: post.id, optionId })}
            onComment={() => setCommentsPostId(post.id)}
            onReport={() => reportPost(post.id)}
          />
        ))}
      </div>

      <CreatePostSheet mode={active} />
      {commentsPostId && (
        <CommentsSheet
          postId={commentsPostId}
          mode={active}
          open={!!commentsPostId}
          onOpenChange={(open) => !open && setCommentsPostId(null)}
        />
      )}
    </div>
  );
}

function PostCard({
  post,
  onLike,
  onVote,
  onComment,
  onReport,
}: {
  post: FeedPost;
  onLike: () => void;
  onVote: (optionId: string) => void;
  onComment: () => void;
  onReport: () => void;
}) {
  const totalVotes = post.pollOptions.reduce((sum, o) => sum + o.voteCount, 0);

  return (
    <article className="mx-4 overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-[var(--shadow-soft)]">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {post.author?.avatarUrl && (
            <img
              src={post.author.avatarUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
            />
          )}
          <div className="leading-tight">
            <div className="flex items-center gap-1 font-display text-base font-medium tracking-tight text-foreground">
              {post.author?.display_name ?? "Someone"}
              {post.author?.is_verified && (
                <BadgeCheck className="h-3.5 w-3.5 text-[var(--mode-brotherhood)]" />
              )}
            </div>
            <div className="text-[11px] text-muted-foreground">{post.author?.city}</div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onReport} className="text-destructive">
              <Flag className="mr-2 h-4 w-4" /> Report post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {post.post_type === "photo" && post.imageUrl && (
        <div className="aspect-square w-full overflow-hidden bg-muted">
          <img src={post.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}

      {post.post_type === "event" && (
        <div className="mx-4 mb-1 rounded-2xl border border-border bg-[var(--gradient-card)] p-4">
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt=""
              className="mb-3 aspect-video w-full rounded-xl object-cover"
              loading="lazy"
            />
          )}
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarDays className="h-4 w-4 text-[var(--mode-matrimonial)]" />
            {post.event_at &&
              new Date(post.event_at).toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
          </div>
          {post.event_location && (
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {post.event_location}
            </div>
          )}
        </div>
      )}

      {post.post_type === "poll" && (
        <div className="mx-4 mb-1 space-y-2">
          {post.pollOptions.map((opt) => {
            const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
            const mine = post.myVoteOptionId === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onVote(opt.id)}
                className="relative block w-full overflow-hidden rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-muted transition-all"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    {mine && <Check className="h-3.5 w-3.5 text-[var(--mode-brotherhood)]" />}
                    {opt.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{pct}%</span>
                </div>
              </button>
            );
          })}
          <p className="text-[11px] text-muted-foreground">
            {totalVotes} vote{totalVotes === 1 ? "" : "s"}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1">
          <IconBtn onClick={onLike}>
            <Heart
              className={`h-5 w-5 ${post.likedByMe ? "fill-current text-[var(--mode-matrimonial)]" : ""}`}
            />
          </IconBtn>
          <IconBtn onClick={onComment}>
            <MessageCircle className="h-5 w-5" />
          </IconBtn>
          <IconBtn>
            <Send className="h-5 w-5" />
          </IconBtn>
        </div>
        <IconBtn>
          <Bookmark className="h-5 w-5" />
        </IconBtn>
      </div>
      <div className="px-4 pb-4">
        <div className="text-sm font-semibold text-foreground">
          {post.likeCount.toLocaleString()} likes
          {post.commentCount > 0 && (
            <button onClick={onComment} className="ml-3 font-normal text-muted-foreground">
              {post.commentCount} comment{post.commentCount === 1 ? "" : "s"}
            </button>
          )}
        </div>
        {post.caption && (
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            <span className="font-display text-base font-medium">{post.author?.display_name}</span>{" "}
            <span className="italic text-muted-foreground">·</span> {post.caption}
          </p>
        )}
        <div className="mt-3">
          <ModeBadge mode={post.mode} />
        </div>
      </div>
    </article>
  );
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full p-2 text-foreground transition hover:bg-muted active:scale-90"
    >
      {children}
    </button>
  );
}
