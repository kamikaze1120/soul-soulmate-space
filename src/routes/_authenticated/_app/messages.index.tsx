import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Users as UsersIcon, ShieldCheck } from "lucide-react";
import { useActiveMode } from "@/lib/active-mode";
import { useThreads, type ThreadSummary } from "@/lib/queries/threads";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_authenticated/_app/messages/")({
  head: () => ({ meta: [{ title: "Chats · Ummah" }] }),
  component: MessagesPage,
});

function threadTitle(t: ThreadSummary): string {
  if (t.kind === "group") return t.title ?? "Group";
  return t.otherMembers[0]?.display_name ?? "Conversation";
}

function MessagesPage() {
  const { active } = useActiveMode();
  const [q, setQ] = useState("");
  const { data: threads, isLoading } = useThreads(active);

  const filtered = useMemo(() => {
    if (!threads) return [];
    if (!q) return threads;
    return threads.filter((t) => threadTitle(t).toLowerCase().includes(q.toLowerCase()));
  }, [threads, q]);

  return (
    <div>
      <div className="px-5 pt-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow text-muted-foreground">Conversations</p>
            <h2 className="font-display mt-1 text-3xl font-medium tracking-tight text-foreground">
              Chats
            </h2>
          </div>
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
        {!isLoading && filtered.length === 0 && (
          <li>
            <EmptyState
              title="No conversations yet"
              description="Like someone in Discover to start a conversation."
            />
          </li>
        )}
        {filtered.map((t) => (
          <ThreadRow key={t.id} t={t} />
        ))}
      </ul>
    </div>
  );
}

function ThreadRow({ t }: { t: ThreadSummary }) {
  const title = threadTitle(t);
  const subline =
    t.kind === "group" ? `${t.members.length} members${t.has_wali ? " · Wali present" : ""}` : "";

  return (
    <li>
      <Link
        to="/messages/$id"
        params={{ id: t.id }}
        className="flex items-center gap-3.5 px-5 py-3.5 transition hover:bg-card/60"
      >
        {t.kind === "group" ? (
          <div className="relative h-14 w-14 shrink-0">
            {t.otherMembers[0]?.avatarUrl && (
              <img
                src={t.otherMembers[0].avatarUrl}
                alt=""
                className="absolute left-0 top-0 h-10 w-10 rounded-full object-cover ring-2 ring-background"
              />
            )}
            {t.otherMembers[1]?.avatarUrl && (
              <img
                src={t.otherMembers[1].avatarUrl}
                alt=""
                className="absolute bottom-0 right-0 h-10 w-10 rounded-full object-cover ring-2 ring-background"
              />
            )}
            {t.has_wali && (
              <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--mode-brotherhood)] ring-2 ring-background">
                <ShieldCheck className="h-3 w-3 text-primary-foreground" />
              </span>
            )}
          </div>
        ) : (
          <div className="relative shrink-0">
            {t.otherMembers[0]?.avatarUrl ? (
              <img
                src={t.otherMembers[0].avatarUrl}
                alt=""
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-muted" />
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 truncate font-display text-lg font-medium tracking-tight text-foreground">
              {title}
              {t.kind === "group" && <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" />}
            </span>
          </div>
          {subline && <div className="text-[11px] text-muted-foreground">{subline}</div>}
          <div className="mt-0.5 truncate text-sm text-muted-foreground">
            {t.lastMessage?.body ?? "Say salaam 👋"}
          </div>
        </div>
      </Link>
    </li>
  );
}
