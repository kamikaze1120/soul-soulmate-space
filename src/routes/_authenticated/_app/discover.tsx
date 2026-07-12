import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { X, Heart, Star, BadgeCheck, MapPin, Eye, EyeOff } from "lucide-react";
import { useActiveMode } from "@/lib/active-mode";
import { useDiscoverDeck, type DiscoverPerson } from "@/lib/queries/discover";
import { useStartDmThread } from "@/lib/queries/threads";
import { MODES } from "@/lib/modes";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/discover")({
  head: () => ({ meta: [{ title: "Discover · Ummah" }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { active } = useActiveMode();
  const { data: deck, isLoading } = useDiscoverDeck(active);
  const startThread = useStartDmThread();
  const [index, setIndex] = useState(0);
  const [blur, setBlur] = useState(active === "matrimonial");

  const current = deck?.[index];
  const next = deck?.[index + 1];

  const advance = async (label: string, person?: DiscoverPerson) => {
    if (!person?.id) return;
    if (label === "Liked") {
      try {
        await startThread.mutateAsync({ otherUserId: person.id, mode: active });
        toast.success(`Started a conversation with ${person.display_name}`);
      } catch {
        toast.error("Couldn't start that conversation.");
      }
    } else {
      toast.success(`${label} ${person.display_name}`);
    }
    setIndex((i) => i + 1);
  };

  const meta = MODES[active];

  return (
    <div className="px-5 pt-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="eyebrow text-muted-foreground">Discover · {meta.tagline}</p>
          <h2 className="font-display mt-1 text-3xl font-medium tracking-tight text-foreground">
            {meta.title}
          </h2>
        </div>
        {active === "matrimonial" && (
          <button
            onClick={() => setBlur((b) => !b)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium shadow-[var(--shadow-soft)]"
          >
            {blur ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {blur ? "Modesty on" : "Modesty off"}
          </button>
        )}
      </div>

      <div className="relative mx-auto h-[540px] w-full max-w-sm">
        {!isLoading && !current && (
          <div className="grid h-full place-items-center rounded-[var(--radius-2xl)] border border-dashed border-border bg-card">
            <EmptyState
              title="You're all caught up."
              description={`Come back later — new ${meta.title.toLowerCase()} profiles every day.`}
            />
          </div>
        )}
        {next && <Card person={next} blur={blur && active === "matrimonial"} stacked />}
        {current && <Card person={current} blur={blur && active === "matrimonial"} />}
      </div>

      {current && (
        <div className="mt-7 flex items-center justify-center gap-5">
          <ActionBtn onClick={() => advance("Passed on", current)} label="Pass" tone="muted">
            <X className="h-7 w-7" />
          </ActionBtn>
          <ActionBtn
            onClick={() => advance("Super-liked", current)}
            label="Super"
            tone="gold"
            small
          >
            <Star className="h-5 w-5" />
          </ActionBtn>
          <ActionBtn onClick={() => advance("Liked", current)} label="Like" tone="primary">
            <Heart className="h-7 w-7 fill-current" />
          </ActionBtn>
        </div>
      )}
    </div>
  );
}

function Card({
  person,
  blur,
  stacked,
}: {
  person: DiscoverPerson;
  blur?: boolean;
  stacked?: boolean;
}) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-[var(--shadow-elevated)] transition ${
        stacked ? "scale-95 opacity-50 -translate-y-3" : ""
      }`}
    >
      {person.coverUrl ? (
        <img
          src={person.coverUrl}
          alt={person.display_name ?? ""}
          className={`h-full w-full object-cover transition ${blur ? "blur-xl scale-110" : ""}`}
        />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 text-white">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-3xl font-medium leading-tight tracking-tight">
            {person.display_name}
          </h3>
          {person.is_verified && <BadgeCheck className="h-5 w-5 text-[var(--accent)]" />}
        </div>
        {person.city && (
          <div className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
            <MapPin className="h-3.5 w-3.5" /> {person.city}
          </div>
        )}
        {person.bio && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/85">{person.bio}</p>
        )}
        {person.kids_age_groups && person.kids_age_groups.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {person.kids_age_groups.map((g) => (
              <span
                key={g}
                className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] backdrop-blur"
              >
                kids {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  label,
  tone,
  small,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  tone: "muted" | "primary" | "gold";
  small?: boolean;
}) {
  const sizes = small ? "h-12 w-12" : "h-16 w-16";
  const styles =
    tone === "primary"
      ? "bg-[var(--gradient-plum)] text-primary-foreground"
      : tone === "gold"
        ? "bg-[var(--gradient-gold)] text-accent-foreground"
        : "bg-card text-muted-foreground border border-border";
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`grid place-items-center rounded-full shadow-[var(--shadow-elevated)] transition active:scale-90 hover:-translate-y-0.5 ${sizes} ${styles}`}
    >
      {children}
    </button>
  );
}
