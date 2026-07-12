import { createFileRoute } from "@tanstack/react-router";
import { Heart, MessageCircle, Send, Bookmark, BadgeCheck, MoreHorizontal } from "lucide-react";
import { useActiveMode } from "@/lib/active-mode";
import { useFeedPosts, useToggleLike } from "@/lib/queries/feed";
import { ModeBadge } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { MODES } from "@/lib/modes";

export const Route = createFileRoute("/_authenticated/_app/feed")({
  head: () => ({ meta: [{ title: "Feed · Ummah" }] }),
  component: FeedPage,
});

function FeedPage() {
  const { active } = useActiveMode();
  const meta = MODES[active];
  const { data: posts, isLoading } = useFeedPosts(active);
  const toggleLike = useToggleLike(active);

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
          <article
            key={post.id}
            className="mx-4 overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-[var(--shadow-soft)]"
          >
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
              <button className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </header>
            {post.imageUrl && (
              <div className="aspect-square w-full overflow-hidden bg-muted">
                <img
                  src={post.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-1">
                <IconBtn
                  onClick={() => toggleLike.mutate({ postId: post.id, liked: post.likedByMe })}
                >
                  <Heart
                    className={`h-5 w-5 ${post.likedByMe ? "fill-current text-[var(--mode-matrimonial)]" : ""}`}
                  />
                </IconBtn>
                <IconBtn>
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
              </div>
              {post.caption && (
                <p className="mt-1 text-sm leading-relaxed text-foreground">
                  <span className="font-display text-base font-medium">
                    {post.author?.display_name}
                  </span>{" "}
                  <span className="italic text-muted-foreground">·</span> {post.caption}
                </p>
              )}
              <div className="mt-3">
                <ModeBadge mode={post.mode} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
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
