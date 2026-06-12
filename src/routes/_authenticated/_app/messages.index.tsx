import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, PenSquare, Users as UsersIcon, ShieldCheck } from "lucide-react";
import { useActiveMode } from "@/lib/active-mode";
import { THREADS, personById, threadAvatars, threadTitle, type Thread } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/_app/messages/")({
  head: () => ({ meta: [{ title: "Chats · Ummah" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { active } = useActiveMode();
  const [q, setQ] = useState("");
  const threads = useMemo(() => {
    const filtered = THREADS.filter((t) => t.mode === active);
    if (!q) return filtered;
    return filtered.filter((t) =>
      threadTitle(t).toLowerCase().includes(q.toLowerCase()),
    );
  }, [active, q]);

  return (
    <div>
      <div className="px-5 pt-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow text-muted-foreground">Conversations</p>
            <h2 className="font-display mt-1 text-3xl font-medium tracking-tight text-foreground">Chats</h2>
          </div>
          <button className="rounded-full border border-border bg-card p-2.5 text-foreground shadow-[var(--shadow-soft)] hover:bg-muted">
            <PenSquare className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search conversations"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <ul className="mt-4 divide-y divide-border/40">
        {threads.length === 0 && (
          <li className="px-6 py-16 text-center text-sm text-muted-foreground">
            No conversations yet.
          </li>
        )}
        {threads.map((t) => <ThreadRow key={t.id} t={t} />)}
      </ul>
    </div>
  );
}

function ThreadRow({ t }: { t: Thread }) {
  const avatars = threadAvatars(t);
  const title = threadTitle(t);
  const subline =
    t.kind === "group" && t.members
      ? `${t.members.length} members${t.hasWali ? " · Wali present" : ""}`
      : t.online
        ? "Active now"
        : `Active ${t.timeAgo} ago`;

  return (
    <li>
      <Link
        to="/messages/$id"
        params={{ id: t.id }}
        className="flex items-center gap-3.5 px-5 py-3.5 transition hover:bg-card/60"
      >
        {t.kind === "group" ? (
          <div className="relative h-14 w-14 shrink-0">
            <img
              src={avatars[0]}
              alt=""
              className="absolute left-0 top-0 h-10 w-10 rounded-full object-cover ring-2 ring-background"
            />
            <img
              src={avatars[1]}
              alt=""
              className="absolute bottom-0 right-0 h-10 w-10 rounded-full object-cover ring-2 ring-background"
            />
            {t.hasWali && (
              <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--mode-brotherhood)] ring-2 ring-background">
                <ShieldCheck className="h-3 w-3 text-primary-foreground" />
              </span>
            )}
          </div>
        ) : (
          <div className="relative shrink-0">
            <img src={personById(t.personId!).avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
            {t.online && (
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500" />
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 truncate font-display text-lg font-medium tracking-tight text-foreground">
              {title}
              {t.kind === "group" && <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" />}
            </span>
            <span className="text-[11px] text-muted-foreground">{t.timeAgo}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">{subline}</div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span className={`truncate text-sm ${t.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {t.lastMessage}
            </span>
            {t.unread > 0 && (
              <span
                className="grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold text-primary-foreground"
                style={{ background: `var(--mode-${t.mode})` }}
              >
                {t.unread}
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
