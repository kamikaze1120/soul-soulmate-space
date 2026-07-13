import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Settings,
  BadgeCheck,
  ShieldCheck,
  Sparkles,
  Grid3x3,
  Bookmark,
  Heart,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useActiveMode } from "@/lib/active-mode";
import { useFeedPosts } from "@/lib/queries/feed";
import { MODES } from "@/lib/modes";

export const Route = createFileRoute("/_authenticated/_app/profile")({
  head: () => ({ meta: [{ title: "Profile · Ummah" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, entitlements } = useAuth();
  const { active } = useActiveMode();
  const activeCount = entitlements.filter((e) => e.is_active).length;
  const { data: posts } = useFeedPosts(active);
  const grid = (posts ?? []).filter((p) => p.author_id === user?.id);

  return (
    <div className="px-5 pt-6">
      <p className="eyebrow text-muted-foreground">Profile</p>
      <h2 className="font-display mt-1 text-3xl font-medium tracking-tight text-foreground">
        {profile?.display_name ?? "You"}
      </h2>

      <div className="mt-6 flex items-start gap-5">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-[var(--gradient-hero)] text-4xl font-display font-medium text-primary-foreground shadow-[var(--shadow-elevated)]">
          {profile?.display_name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            {profile?.is_verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--mode-brotherhood)] px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] text-muted-foreground">
                Pending verification
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {profile?.verified_gender
              ? `Verified ${profile.verified_gender}`
              : "Gender not yet verified"}
          </div>
          <div className="mt-4 flex gap-6 text-sm">
            <Stat label="Posts" value={grid.length} />
            <Stat label="Connections" value={48} />
            <Stat label="Modes" value={activeCount} />
          </div>
        </div>
      </div>

      <p className="font-display mt-6 text-lg italic text-muted-foreground">
        Currently in <span className="text-foreground not-italic">{MODES[active].title}</span> ·{" "}
        {MODES[active].tagline}
      </p>

      <div className="mt-5 flex gap-2">
        <Link
          to="/modes"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-card border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted shadow-[var(--shadow-soft)]"
        >
          <Settings className="h-4 w-4" /> Manage modes
        </Link>
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--gradient-gold)] px-3 py-2.5 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-gold)]">
          <Sparkles className="h-4 w-4" /> Boost profile
        </button>
      </div>

      {!profile?.is_verified && (
        <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-2xl)] border border-accent/40 bg-[var(--gradient-card)] p-5 shadow-[var(--shadow-soft)]">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--gradient-gold)] text-accent-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="font-display text-lg font-medium tracking-tight text-foreground">
              Verify your identity
            </p>
            <p className="text-xs text-muted-foreground">Government ID check — unlocks Nikah.</p>
          </div>
          <Link
            to="/verify"
            className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
          >
            Start
          </Link>
        </div>
      )}

      <div className="mt-8 grid grid-cols-3 border-y border-border/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <TabBtn icon={Grid3x3} active label="Posts" />
        <TabBtn icon={Heart} label="Liked" />
        <TabBtn icon={Bookmark} label="Saved" />
      </div>

      <div className="mt-1 grid grid-cols-3 gap-1">
        {grid.length === 0 && (
          <div className="col-span-3 py-10 text-center text-sm text-muted-foreground">
            No posts yet.
          </div>
        )}
        {grid.map((p) => (
          <div key={p.id} className="aspect-square overflow-hidden bg-muted">
            {p.imageUrl && (
              <img src={p.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-display text-2xl font-medium text-foreground">{value}</div>
      <div className="eyebrow mt-0.5 text-muted-foreground">{label}</div>
    </div>
  );
}

function TabBtn({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof Grid3x3;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex items-center justify-center gap-1.5 py-3 transition ${
        active ? "border-t-2 border-foreground text-foreground -mt-px" : "hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
