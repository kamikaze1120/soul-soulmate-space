import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Phone, Video, Send, Plus, Smile, ShieldCheck, UserPlus, Users as UsersIcon } from "lucide-react";
import { THREADS, MESSAGES, personById, threadTitle, type Message, type Thread } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/messages/$id")({
  head: () => ({ meta: [{ title: "Conversation · Ummah" }] }),
  component: ThreadPage,
});

function ThreadPage() {
  const { id } = Route.useParams();
  const initialThread = THREADS.find((t) => t.id === id);
  if (!initialThread) throw notFound();

  const [thread, setThread] = useState<Thread>(initialThread);
  const initial = MESSAGES[id] ?? [];
  const [msgs, setMsgs] = useState<Message[]>(initial);
  const [text, setText] = useState("");

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 1000) return toast.error("Message is too long (max 1000 chars).");
    setMsgs((m) => [
      ...m,
      { id: crypto.randomUUID(), threadId: id, fromMe: true, text: trimmed, time: "now" },
    ]);
    setText("");
  };

  const isMatri = thread.mode === "matrimonial";
  const isGroup = thread.kind === "group";

  const addWali = () => {
    if (isGroup) return;
    setThread((t) => ({
      ...t,
      kind: "group",
      title: `${personById(t.personId!).name} · Wali present`,
      members: [t.personId!, "wali-1"],
      hasWali: true,
    }));
    setMsgs((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        threadId: id,
        fromMe: false,
        system: true,
        text: "Br. Omar (Wali) joined the conversation.",
        time: "now",
      },
    ]);
    toast.success("Wali added to conversation");
  };

  // Header data
  const headerAvatar = isGroup
    ? personById(thread.members![0]).avatar
    : personById(thread.personId!).avatar;
  const headerTitle = threadTitle(thread);

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-[var(--app-canvas)]">
      {/* Thread header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur">
        <Link to="/messages" className="rounded-full p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {isGroup ? (
          <div className="relative h-10 w-10 shrink-0">
            <img src={personById(thread.members![0]).avatar} alt="" className="absolute left-0 top-0 h-7 w-7 rounded-full object-cover ring-2 ring-background" />
            <img src={personById(thread.members![1]).avatar} alt="" className="absolute bottom-0 right-0 h-7 w-7 rounded-full object-cover ring-2 ring-background" />
          </div>
        ) : (
          <img src={headerAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5">
            <div className="truncate font-display text-base font-medium tracking-tight text-foreground">
              {headerTitle}
            </div>
            {isGroup && <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {isGroup
              ? `${thread.members!.length} members${thread.hasWali ? " · Wali present" : ""}`
              : thread.online ? "Active now" : `Active ${thread.timeAgo} ago`}
          </div>
        </div>
        <button className="rounded-full p-2 text-muted-foreground hover:bg-muted"><Phone className="h-5 w-5" /></button>
        <button className="rounded-full p-2 text-muted-foreground hover:bg-muted"><Video className="h-5 w-5" /></button>
      </header>

      {/* Wali banner / promote-to-group CTA for Nikah */}
      {isMatri && (
        <div className="mx-4 mt-3 flex items-start gap-2.5 rounded-2xl border border-accent/40 bg-[var(--gradient-card)] p-3.5 text-xs text-foreground shadow-[var(--shadow-soft)]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mode-brotherhood)]" />
          <div className="flex-1">
            <p className="font-medium">
              {isGroup
                ? "Wali-friendly group. All participants can see every message."
                : "Wali-friendly chat. Promote this conversation to a group with your wali in one tap."}
            </p>
            {!isGroup && (
              <button
                onClick={addWali}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background hover:opacity-90"
              >
                <UserPlus className="h-3 w-3" /> Add Wali to conversation
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-5">
        {msgs.map((m) => {
          if (m.system) {
            return (
              <div key={m.id} className="my-3 text-center">
                <span className="rounded-full bg-card px-3 py-1 text-[11px] text-muted-foreground shadow-[var(--shadow-soft)]">
                  {m.text}
                </span>
              </div>
            );
          }
          const sender = !m.fromMe && isGroup && m.fromId ? personById(m.fromId) : null;
          return (
            <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
              {!m.fromMe && (
                <img
                  src={sender ? sender.avatar : (isGroup ? personById(thread.members![0]).avatar : personById(thread.personId!).avatar)}
                  alt=""
                  className="mr-2 mt-auto h-6 w-6 shrink-0 rounded-full object-cover"
                />
              )}
              <div
                className={`max-w-[78%] rounded-3xl px-4 py-2.5 text-sm leading-snug shadow-[var(--shadow-soft)] ${
                  m.fromMe
                    ? "rounded-br-md text-primary-foreground"
                    : "rounded-bl-md bg-card text-foreground"
                }`}
                style={m.fromMe ? { background: `var(--mode-${thread.mode})` } : undefined}
              >
                {sender && (
                  <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-70">
                    {sender.name}
                  </div>
                )}
                {m.text}
                <div className={`mt-0.5 text-[10px] ${m.fromMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {m.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-border/50 bg-background/95 px-3 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 shadow-[var(--shadow-soft)]">
          <button className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted">
            <Plus className="h-5 w-5" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message…"
            maxLength={1000}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted">
            <Smile className="h-5 w-5" />
          </button>
          <button
            onClick={send}
            disabled={!text.trim()}
            className="grid h-9 w-9 place-items-center rounded-full text-primary-foreground transition disabled:opacity-40"
            style={{ background: `var(--mode-${thread.mode})` }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
