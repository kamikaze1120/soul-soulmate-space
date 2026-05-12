import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Heart, MessageCircle, Send, Bookmark, BadgeCheck, MoreHorizontal } from "lucide-react";
import { useActiveMode } from "@/lib/active-mode";
import { FEED, PEOPLE, personById } from "@/lib/mock-data";
import { ModeBadge } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/_app/feed")({
  head: () => ({ meta: [{ title: "Feed · Ummah" }] }),
  component: FeedPage,
});

function FeedPage() {
  const { active } = useActiveMode();
  const posts = useMemo(() => FEED.filter((p) => p.mode === active), [active]);
  const stories = useMemo(() => PEOPLE.filter((p) => p.modes.includes(active)).slice(0, 6), [active]);

  return (
    <div>
      {/* Stories rail */}
      <div className="border-b border-border/60 bg-card/40">
        <div className="flex gap-4 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {stories.map((p) => (
            <button key={p.id} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
              <span
                className="grid h-16 w-16 place-items-center rounded-full p-[2px]"
                style={{ background: "conic-gradient(from 180deg, var(--mode-matrimonial), var(--mode-sisterhood), var(--accent), var(--mode-brotherhood), var(--mode-matrimonial))" }}
              >
                <span className="grid h-full w-full place-items-center rounded-full bg-background p-[2px]">
                  <img src={p.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                </span>
              </span>
              <span className="max-w-full truncate text-[11px] text-muted-foreground">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="divide-y divide-border/60">
        {posts.length === 0 && (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            No posts yet in this mode. Check back soon, in shaa Allah.
          </div>
        )}
        {posts.map((post) => {
          const author = personById(post.authorId);
          return (
            <article key={post.id} className="bg-background">
              <header className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <img src={author.avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-border" />
                  <div className="leading-tight">
                    <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                      {author.name}
                      {author.verified && <BadgeCheck className="h-3.5 w-3.5 text-[var(--mode-brotherhood)]" />}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{author.city} · {post.timeAgo}</div>
                  </div>
                </div>
                <button className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </header>
              <div className="aspect-square w-full overflow-hidden bg-muted">
                <img src={post.image} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-1">
                  <IconBtn><Heart className="h-6 w-6" /></IconBtn>
                  <IconBtn><MessageCircle className="h-6 w-6" /></IconBtn>
                  <IconBtn><Send className="h-6 w-6" /></IconBtn>
                </div>
                <IconBtn><Bookmark className="h-6 w-6" /></IconBtn>
              </div>
              <div className="px-4 pb-4">
                <div className="text-sm font-semibold text-foreground">{post.likes.toLocaleString()} likes</div>
                <p className="mt-1 text-sm text-foreground">
                  <span className="font-semibold">{author.name}</span> {post.caption}
                </p>
                <button className="mt-1 text-xs text-muted-foreground">View all {post.comments} comments</button>
                <div className="mt-2"><ModeBadge mode={post.mode} /></div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="rounded-full p-2 text-foreground transition hover:bg-muted active:scale-90">
      {children}
    </button>
  );
}
