import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, BadgeCheck, ShieldCheck, Sparkles, Grid3x3, Bookmark, Heart } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useActiveMode } from "@/lib/active-mode";
import { FEED } from "@/lib/mock-data";
import { MODES } from "@/lib/modes";

export const Route = createFileRoute("/_authenticated/_app/profile")({
  head: () => ({ meta: [{ title: "Profile · Ummah" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, entitlements } = useAuth();
  const { active } = useActiveMode();
  const activeCount = entitlements.filter((e) => e.is_active).length;
  const grid = FEED.slice(0, 6);

  return (
    <div className="px-4 pt-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--gradient-hero)] text-3xl font-semibold text-primary-foreground">
          {profile?.display_name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              {profile?.display_name ?? "You"}
            </h2>
            {profile?.is_verified ? (
              <BadgeCheck className="h-4 w-4 text-[var(--mode-brotherhood)]" />
            ) : null}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {profile?.verified_gender ? `Verified ${profile.verified_gender}` : "Verification pending"}
          </div>
          <div className="mt-3 flex gap-5 text-sm">
            <Stat label="Posts" value={grid.length} />
            <Stat label="Connections" value={48} />
            <Stat label="Modes" value={activeCount} />
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-foreground">
        Currently in <span className="font-semibold">{MODES[active].title}</span> · {MODES[active].tagline}
      </p>

      <div className="mt-4 flex gap-2">
        <Link
          to="/modes"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/80"
        >
          <Settings className="h-4 w-4" /> Manage modes
        </Link>
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--gradient-gold)] px-3 py-2 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-gold)]">
          <Sparkles className="h-4 w-4" /> Boost profile
        </button>
      </div>

      {!profile?.is_verified && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-accent/40 bg-[var(--gradient-card)] p-4 shadow-[var(--shadow-soft)]">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--gradient-gold)] text-accent-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Verify your identity</p>
            <p className="text-xs text-muted-foreground">Government ID + 3-second liveness video.</p>
          </div>
          <button className="rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background">Start</button>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 grid grid-cols-3 border-y border-border/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <TabBtn icon={Grid3x3} active label="Posts" />
        <TabBtn icon={Heart} label="Liked" />
        <TabBtn icon={Bookmark} label="Saved" />
      </div>

      {/* Grid */}
      <div className="mt-1 grid grid-cols-3 gap-1">
        {grid.map((p) => (
          <div key={p.id} className="aspect-square overflow-hidden bg-muted">
            <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-semibold text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function TabBtn({ icon: Icon, label, active }: { icon: typeof Grid3x3; label: string; active?: boolean }) {
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
