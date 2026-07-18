import { useState } from "react";
import { Send } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useComments, useAddComment } from "@/lib/queries/comments";
import type { AppMode } from "@/lib/modes";
import { toast } from "sonner";

export function CommentsSheet({
  postId,
  mode,
  open,
  onOpenChange,
}: {
  postId: string;
  mode: AppMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: comments, isLoading } = useComments(postId, open);
  const addComment = useAddComment(mode, postId);
  const [body, setBody] = useState("");

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync(trimmed);
      setBody("");
    } catch {
      toast.error("Couldn't post comment.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[80vh] flex-col rounded-t-[var(--radius-2xl)]"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-xl font-medium">Comments</SheetTitle>
        </SheetHeader>

        <div className="mt-3 flex-1 space-y-3 overflow-y-auto">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && (!comments || comments.length === 0) && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
          {comments?.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              {c.author?.avatarUrl ? (
                <img
                  src={c.author.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-muted" />
              )}
              <div className="rounded-2xl bg-muted px-3 py-2 text-sm">
                <div className="font-medium text-foreground">
                  {c.author?.display_name ?? "Someone"}
                </div>
                <div className="text-foreground/90">{c.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Add a comment…"
            maxLength={1000}
            className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm outline-none"
          />
          <button
            onClick={submit}
            disabled={!body.trim() || addComment.isPending}
            className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background disabled:opacity-50"
            aria-label="Send comment"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
