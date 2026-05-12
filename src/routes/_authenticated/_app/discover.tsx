import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { X, Heart, Star, BadgeCheck, MapPin, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useActiveMode } from "@/lib/active-mode";
import { PEOPLE, type Person } from "@/lib/mock-data";
import { MODES } from "@/lib/modes";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/discover")({
  head: () => ({ meta: [{ title: "Discover · Ummah" }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { active } = useActiveMode();
  const deck = useMemo(() => PEOPLE.filter((p) => p.modes.includes(active)), [active]);
  const [index, setIndex] = useState(0);
  const [blur, setBlur] = useState(active === "matrimonial");

  const current = deck[index];
  const next = deck[index + 1];

  const advance = (label: string) => {
    if (!current) return;
    toast.success(`${label} ${current.name}`);
    setIndex((i) => i + 1);
  };

  const meta = MODES[active];

  return (
    <div className="px-4 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{meta.title}</h2>
          <p className="text-xs text-muted-foreground">{meta.tagline}</p>
        </div>
        {active === "matrimonial" && (
          <button
            onClick={() => setBlur((b) => !b)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium"
          >
            {blur ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {blur ? "Modesty on" : "Modesty off"}
          </button>
        )}
      </div>

      <div className="relative mx-auto h-[520px] w-full max-w-sm">
        {!current && (
          <div className="grid h-full place-items-center rounded-3xl border border-dashed border-border bg-card text-center">
            <div className="px-6">
              <p className="font-semibold text-foreground">You're all caught up</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Come back later — new {meta.title.toLowerCase()} profiles every day.
              </p>
            </div>
          </div>
        )}
        {next && <Card person={next} blur={blur && active === "matrimonial"} stacked />}
        {current && <Card person={current} blur={blur && active === "matrimonial"} />}
      </div>

      {current && (
        <div className="mt-6 flex items-center justify-center gap-5">
          <ActionBtn onClick={() => advance("Passed on")} label="Pass" tone="muted">
            <X className="h-7 w-7" />
          </ActionBtn>
          <ActionBtn onClick={() => advance("Super-liked")} label="Super" tone="gold" small>
            <Star className="h-5 w-5" />
          </ActionBtn>
          <ActionBtn onClick={() => advance("Liked")} label="Like" tone="primary">
            <Heart className="h-7 w-7 fill-current" />
          </ActionBtn>
        </div>
      )}
    </div>
  );
}

function Card({ person, blur, stacked }: { person: Person; blur?: boolean; stacked?: boolean }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elevated)] transition ${
        stacked ? "scale-95 opacity-60 -translate-y-3" : ""
      }`}
    >
      <img
        src={person.cover}
        alt={person.name}
        className={`h-full w-full object-cover transition ${blur ? "blur-xl scale-110" : ""}`}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 text-white">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-semibold leading-tight">
            {person.name}, {person.age}
          </h3>
          {person.verified && <BadgeCheck className="h-5 w-5 text-[var(--accent)]" />}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
          <MapPin className="h-3.5 w-3.5" /> {person.city}
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-white/85">{person.bio}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {person.walied && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] backdrop-blur">
              <ShieldCheck className="h-3 w-3" /> Wali linked
            </span>
          )}
          {person.kidsAges?.map((g) => (
            <span key={g} className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] backdrop-blur">
              kids {g}
            </span>
          ))}
        </div>
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
      ? "bg-[var(--mode-matrimonial)] text-primary-foreground"
      : tone === "gold"
        ? "bg-[var(--gradient-gold)] text-accent-foreground"
        : "bg-card text-muted-foreground border border-border";
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`grid place-items-center rounded-full shadow-[var(--shadow-elevated)] transition active:scale-90 ${sizes} ${styles}`}
    >
      {children}
    </button>
  );
}
