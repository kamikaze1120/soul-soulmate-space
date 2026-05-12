import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, PenSquare } from "lucide-react";
import { useActiveMode } from "@/lib/active-mode";
import { THREADS, personById } from "@/lib/mock-data";

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
      personById(t.personId).name.toLowerCase().includes(q.toLowerCase()),
    );
  }, [active, q]);

  return (
    <div>
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Chats</h2>
          <button className="rounded-full border border-border bg-card p-2 text-foreground hover:bg-muted">
            <PenSquare className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-full bg-muted px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search conversations"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <ul className="mt-2 divide-y divide-border/50">
        {threads.length === 0 && (
          <li className="px-6 py-12 text-center text-sm text-muted-foreground">
            No conversations yet.
          </li>
        )}
        {threads.map((t) => {
          const p = personById(t.personId);
          return (
            <li key={t.id}>
              <Link
                to="/messages/$id"
                params={{ id: t.id }}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/60"
              >
                <div className="relative">
                  <img src={p.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
                  {t.online && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-semibold text-foreground">{p.name}</span>
                    <span className="text-[11px] text-muted-foreground">{t.timeAgo}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${t.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {t.lastMessage}
                    </span>
                    {t.unread > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--mode-matrimonial)] px-1.5 text-[11px] font-semibold text-primary-foreground">
                        {t.unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
