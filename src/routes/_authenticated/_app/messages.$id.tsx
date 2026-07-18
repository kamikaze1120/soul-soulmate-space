import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Send,
  Plus,
  Smile,
  ShieldCheck,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useThreads } from "@/lib/queries/threads";
import { useMessages, useSendMessage } from "@/lib/queries/messages";
import { useCreateWaliInvite } from "@/lib/queries/wali";
import { useConnections, useInviteToGroup, useToggleGroupCrossGender } from "@/lib/queries/groups";
import { useMessagesSubscription } from "@/lib/realtime/use-messages-subscription";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/messages/$id")({
  head: () => ({ meta: [{ title: "Conversation · Ummah" }] }),
  component: ThreadPage,
});

function ThreadPage() {
  const { id } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const [text, setText] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  // Threads aren't fetched by id directly (no single-thread hook yet) — pull
  // from whichever mode's thread list already has it cached/loaded.
  const matrimonial = useThreads("matrimonial");
  const sisterhood = useThreads("sisterhood");
  const brotherhood = useThreads("brotherhood");
  const thread =
    matrimonial.data?.find((t) => t.id === id) ??
    sisterhood.data?.find((t) => t.id === id) ??
    brotherhood.data?.find((t) => t.id === id);

  const { data: messages } = useMessages(id);
  const sendMessage = useSendMessage(id);
  useMessagesSubscription(id);
  const createWaliInvite = useCreateWaliInvite();
  const [waliInviteLink, setWaliInviteLink] = useState<string | null>(null);

  const toggleCrossGender = useToggleGroupCrossGender(thread?.mode ?? "sisterhood");

  const inviteWali = async () => {
    try {
      const token = await createWaliInvite.mutateAsync(id);
      const link = `${window.location.origin}/wali-invite/${token}`;
      setWaliInviteLink(link);
      if (navigator.share) {
        await navigator.share({ title: "Join as a Wali on Ummah", url: link });
      } else {
        await navigator.clipboard.writeText(link);
        toast.success("Invite link copied.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create that invite.");
    }
  };

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 1000) return toast.error("Message is too long (max 1000 chars).");
    try {
      await sendMessage.mutateAsync(trimmed);
      setText("");
    } catch {
      toast.error("Couldn't send that message.");
    }
  };

  if (!thread) {
    return (
      <div className="px-6 py-16 text-center text-sm text-muted-foreground">
        Loading conversation…
      </div>
    );
  }

  const isGroup = thread.kind === "group";
  const isCommunity = thread.kind === "community";
  const headerTitle =
    isGroup || isCommunity
      ? (thread.title ?? "Group")
      : (thread.otherMembers[0]?.display_name ?? "Conversation");
  const headerAvatar = thread.otherMembers[0]?.avatarUrl;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-[var(--app-canvas)]">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur">
        <Link to="/messages" className="rounded-full p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {headerAvatar ? (
          <img src={headerAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-muted" />
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5">
            <div className="truncate font-display text-base font-medium tracking-tight text-foreground">
              {headerTitle}
            </div>
            {(isGroup || isCommunity) && (
              <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
          {(isGroup || isCommunity) && (
            <div className="text-[11px] text-muted-foreground">
              {thread.members.length} members{thread.has_wali ? " · Wali present" : ""}
            </div>
          )}
        </div>
        {isCommunity && (
          <button
            onClick={() => setShowInvite(true)}
            className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-muted"
            aria-label="Invite to group"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        )}
      </header>

      {isCommunity && isAdmin && (
        <div className="mx-4 mt-3 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-[var(--shadow-soft)]">
          <div>
            <p className="font-medium text-foreground">Allow cross-gender invites</p>
            <p className="text-[11px] text-muted-foreground">
              Admin override — lets members invite connections of the opposite gender.
            </p>
          </div>
          <Switch
            checked={thread.allow_cross_gender}
            onCheckedChange={(checked) =>
              toggleCrossGender.mutate({ threadId: thread.id, enabled: checked })
            }
          />
        </div>
      )}

      <div className="mx-4 mt-3 flex items-start gap-2.5 rounded-2xl border border-accent/40 bg-[var(--gradient-card)] p-3.5 text-xs text-foreground shadow-[var(--shadow-soft)]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mode-brotherhood)]" />
        <div className="flex-1">
          <p className="font-medium">
            Invite a wali (family guardian) into this conversation. They'll get a link to sign up
            or join — no existing account needed.
          </p>
          {waliInviteLink && (
            <div className="mt-2 truncate rounded-full border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground">
              {waliInviteLink}
            </div>
          )}
          <button
            onClick={inviteWali}
            disabled={createWaliInvite.isPending}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            <UserPlus className="h-3 w-3" />
            {createWaliInvite.isPending ? "Creating…" : "Invite a Wali"}
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-5">
        {messages?.map((m) => {
          const fromMe = m.sender_id === user?.id;
          if (m.is_system) {
            return (
              <div key={m.id} className="my-3 text-center">
                <span className="rounded-full bg-card px-3 py-1 text-[11px] text-muted-foreground shadow-[var(--shadow-soft)]">
                  {m.body}
                </span>
              </div>
            );
          }
          return (
            <div key={m.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-3xl px-4 py-2.5 text-sm leading-snug shadow-[var(--shadow-soft)] ${
                  fromMe
                    ? "rounded-br-md text-primary-foreground"
                    : "rounded-bl-md bg-card text-foreground"
                }`}
                style={fromMe ? { background: `var(--mode-${thread.mode})` } : undefined}
              >
                {m.body}
                <div
                  className={`mt-0.5 text-[10px] ${fromMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  {new Date(m.created_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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

      {isCommunity && (
        <InviteSheet
          open={showInvite}
          onOpenChange={setShowInvite}
          mode={thread.mode}
          threadId={thread.id}
          existingMemberIds={thread.members.map((m) => m.id).filter((id): id is string => !!id)}
        />
      )}
    </div>
  );
}

function InviteSheet({
  open,
  onOpenChange,
  mode,
  threadId,
  existingMemberIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "matrimonial" | "sisterhood" | "brotherhood";
  threadId: string;
  existingMemberIds: string[];
}) {
  const { data: connections, isLoading } = useConnections(mode, open);
  const invite = useInviteToGroup(mode, threadId);

  const invitable = (connections ?? []).filter((c) => !existingMemberIds.includes(c.id ?? ""));

  const doInvite = async (id: string) => {
    try {
      await invite.mutateAsync(id);
      toast.success("Invited.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't invite that person.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[80vh] overflow-y-auto rounded-t-[var(--radius-2xl)]"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-xl font-medium">Invite connections</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && invitable.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No connections available to invite. You can only invite people you already have a
              conversation with.
            </p>
          )}
          {invitable.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 py-1.5">
              <div className="flex items-center gap-2.5">
                {c.avatarUrl ? (
                  <img src={c.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-muted" />
                )}
                <span className="text-sm font-medium text-foreground">{c.display_name}</span>
              </div>
              <button
                onClick={() => c.id && doInvite(c.id)}
                disabled={invite.isPending}
                className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background disabled:opacity-50"
              >
                Invite
              </button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
