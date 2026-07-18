import { useState } from "react";
import { Image as ImageIcon, CalendarDays, BarChart3, Plus, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreatePost, type PostType } from "@/lib/queries/feed";
import type { AppMode } from "@/lib/modes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TYPES: { id: PostType; label: string; icon: React.ReactNode }[] = [
  { id: "photo", label: "Photo", icon: <ImageIcon className="h-4 w-4" /> },
  { id: "event", label: "Event", icon: <CalendarDays className="h-4 w-4" /> },
  { id: "poll", label: "Poll", icon: <BarChart3 className="h-4 w-4" /> },
];

export function CreatePostSheet({ mode }: { mode: AppMode }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PostType>("photo");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [eventAt, setEventAt] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const createPost = useCreatePost();

  const reset = () => {
    setType("photo");
    setCaption("");
    setFile(null);
    setEventAt("");
    setEventLocation("");
    setOptions(["", ""]);
  };

  const canSubmit =
    !createPost.isPending &&
    (type === "photo"
      ? !!file
      : type === "event"
        ? !!eventAt
        : options.filter((o) => o.trim()).length >= 2);

  const submit = async () => {
    try {
      if (type === "photo") {
        if (!file) return;
        await createPost.mutateAsync({ mode, type, caption, file });
      } else if (type === "event") {
        await createPost.mutateAsync({
          mode,
          type,
          caption,
          eventAt: new Date(eventAt).toISOString(),
          eventLocation,
          file: file ?? undefined,
        });
      } else {
        await createPost.mutateAsync({
          mode,
          type,
          caption,
          options: options.map((o) => o.trim()).filter(Boolean),
        });
      }
      toast.success("Posted.");
      reset();
      setOpen(false);
    } catch {
      toast.error("Couldn't post — try again.");
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <SheetTrigger asChild>
        <button
          className="fixed bottom-24 right-5 z-20 grid h-14 w-14 place-items-center rounded-full bg-foreground text-background shadow-[var(--shadow-elevated)] transition active:scale-95"
          style={{ bottom: "calc(6.5rem + var(--safe-area-bottom))" }}
          aria-label="Create post"
        >
          <Plus className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-[var(--radius-2xl)]"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-2xl font-medium">Create</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition",
                type === t.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground",
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Say something…"
              className="mt-1.5"
              maxLength={2000}
            />
          </div>

          {(type === "photo" || type === "event") && (
            <div>
              <Label htmlFor="image">
                {type === "photo" ? "Photo or short video" : "Photo (optional)"}
              </Label>
              <Input
                id="image"
                type="file"
                accept={type === "photo" ? "image/*,video/*" : "image/*"}
                className="mt-1.5"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          {type === "event" && (
            <>
              <div>
                <Label htmlFor="event-at">Date &amp; time</Label>
                <Input
                  id="event-at"
                  type="datetime-local"
                  className="mt-1.5"
                  value={eventAt}
                  onChange={(e) => setEventAt(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Where's it happening?"
                  className="mt-1.5"
                  maxLength={200}
                />
              </div>
            </>
          )}

          {type === "poll" && (
            <div className="space-y-2">
              <Label>Options</Label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                    placeholder={`Option ${i + 1}`}
                    maxLength={120}
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                      aria-label="Remove option"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button
                  onClick={() => setOptions([...options, ""])}
                  className="text-xs font-medium text-muted-foreground underline"
                >
                  + Add option
                </button>
              )}
            </div>
          )}

          <Button className="w-full rounded-full" disabled={!canSubmit} onClick={submit}>
            {createPost.isPending ? "Posting…" : "Post"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
