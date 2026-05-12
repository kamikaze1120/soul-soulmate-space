import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Phone, Video, Send, Plus, Smile, ShieldCheck } from "lucide-react";
import { THREADS, MESSAGES, personById, type Message } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/_app/messages/$id")({
  head: () => ({ meta: [{ title: "Conversation · Ummah" }] }),
  component: ThreadPage,
});

function ThreadPage() {
  const { id } = Route.useParams();
  const thread = THREADS.find((t) => t.id === id);
  if (!thread) throw notFound();
  const person = personById(thread.personId);
  const initial = MESSAGES[id] ?? [];
  const [msgs, setMsgs] = useState<Message[]>(initial);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setMsgs((m) => [
      ...m,
      { id: crypto.randomUUID(), threadId: id, fromMe: true, text: text.trim(), time: "now" },
    ]);
    setText("");
  };

  const isMatri = thread.mode === "matrimonial";

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Thread header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background/95 px-3 py-2.5 backdrop-blur">
        <Link to="/messages" className="rounded-full p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <img src={person.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-semibold text-foreground">{person.name}</div>
          <div className="text-[11px] text-muted-foreground">
            {thread.online ? "Active now" : `Active ${thread.timeAgo} ago`}
          </div>
        </div>
        <button className="rounded-full p-2 text-muted-foreground hover:bg-muted"><Phone className="h-5 w-5" /></button>
        <button className="rounded-full p-2 text-muted-foreground hover:bg-muted"><Video className="h-5 w-5" /></button>
      </header>

      {isMatri && (
        <div className="mx-3 mt-3 flex items-start gap-2 rounded-2xl border border-accent/40 bg-[var(--gradient-card)] p-3 text-xs text-foreground shadow-[var(--shadow-soft)]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mode-brotherhood)]" />
          <p>
            Wali-friendly chat. Conversations are kept respectful and may be visible to a wali if linked.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
            {!m.fromMe && (
              <img src={person.avatar} alt="" className="mr-2 mt-auto h-6 w-6 shrink-0 rounded-full object-cover" />
            )}
            <div
              className={`max-w-[78%] rounded-3xl px-4 py-2 text-sm leading-snug ${
                m.fromMe
                  ? "rounded-br-md bg-[var(--mode-matrimonial)] text-primary-foreground"
                  : "rounded-bl-md bg-muted text-foreground"
              }`}
            >
              {m.text}
              <div className={`mt-0.5 text-[10px] ${m.fromMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {m.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-border/60 bg-background/95 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2 rounded-full bg-muted px-2 py-1.5">
          <button className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-background">
            <Plus className="h-5 w-5" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-background">
            <Smile className="h-5 w-5" />
          </button>
          <button
            onClick={send}
            disabled={!text.trim()}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--mode-matrimonial)] text-primary-foreground transition disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
