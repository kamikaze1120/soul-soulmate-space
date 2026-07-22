import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Heart,
  Star,
  BadgeCheck,
  MapPin,
  Eye,
  EyeOff,
  UserPlus,
  Check,
  Clock,
  UserX,
  PartyPopper,
  MapPinOff,
  Inbox,
} from "lucide-react";
import { useActiveMode } from "@/lib/active-mode";
import { useAuth } from "@/lib/auth";
import { useStartDmThread } from "@/lib/queries/threads";
import {
  useNearbyProfiles,
  useMyLocation,
  useSendConnectionRequest,
  useIncomingConnectionRequests,
  useRespondToConnectionRequest,
  MIN_RADIUS_MILES,
  MAX_RADIUS_MILES,
  type NearbyPerson,
} from "@/lib/queries/discover";
import { MODES, type AppMode } from "@/lib/modes";
import { EmptyState } from "@/components/empty-state";
import { LocationPicker } from "@/components/location-picker";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/discover")({
  head: () => ({ meta: [{ title: "Discover · Ummah" }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { active } = useActiveMode();
  const { isWali } = useAuth();

  if (isWali) {
    return (
      <div className="px-5 pt-6">
        <EmptyState
          icon={UserX}
          title="Not available for Wali accounts"
          description="Wali accounts can view and comment on posts, and take part in the conversation they were invited to — but can't start new connections."
        />
      </div>
    );
  }

  return active === "matrimonial" ? <SwipeDeck /> : <NearbyList />;
}

function useRadiusState() {
  const [radius, setRadius] = useState(50);
  return { radius, setRadius };
}

function RadiusControl({ radius, onChange }: { radius: number; onChange: (v: number) => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Search radius</span>
        <span className="text-muted-foreground">{radius} mi</span>
      </div>
      <Slider
        className="mt-3"
        min={MIN_RADIUS_MILES}
        max={MAX_RADIUS_MILES}
        step={5}
        value={[radius]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

// ── Nikah: swipe deck, now driven by location + radius ──────────────────
function SwipeDeck() {
  const { active } = useActiveMode();
  const meta = MODES[active];
  const { data: location } = useMyLocation();
  const { radius, setRadius } = useRadiusState();
  const [showSettings, setShowSettings] = useState(false);
  const coords =
    location?.latitude && location?.longitude
      ? { lat: location.latitude, lng: location.longitude }
      : null;
  const { data: deck, isLoading } = useNearbyProfiles("matrimonial", coords, radius);
  const startThread = useStartDmThread();
  const [index, setIndex] = useState(0);
  const [blur, setBlur] = useState(true);

  const current = deck?.[index];
  const next = deck?.[index + 1];

  const advance = async (label: string, person?: NearbyPerson) => {
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

  return (
    <div className="px-5 pt-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="eyebrow text-muted-foreground">Discover · {meta.tagline}</p>
          <h2 className="font-display mt-1 text-3xl font-medium tracking-tight text-foreground">
            {meta.title}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium shadow-[var(--shadow-soft)]"
          >
            <MapPin className="h-3.5 w-3.5" /> {radius} mi
          </button>
          <button
            onClick={() => setBlur((b) => !b)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium shadow-[var(--shadow-soft)]"
          >
            {blur ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {blur ? "Modesty on" : "Modesty off"}
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-5 space-y-3">
          <LocationPicker />
          <RadiusControl radius={radius} onChange={setRadius} />
        </div>
      )}

      {!coords ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
          <MapPinOff className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Set your location to see Nikah matches near you.
          </p>
          <div className="mt-4">
            <LocationPicker compact />
          </div>
        </div>
      ) : (
        <>
          <div className="relative mx-auto h-[540px] w-full max-w-sm">
            {!isLoading && !current && (
              <div className="grid h-full place-items-center rounded-[var(--radius-2xl)] border border-dashed border-border bg-card">
                <EmptyState
                  icon={PartyPopper}
                  title="You're all caught up."
                  description={`No more matches within ${radius} mi — try widening your search radius.`}
                />
              </div>
            )}
            {next && <Card person={next} blur={blur} stacked />}
            {current && <Card person={current} blur={blur} />}
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
        </>
      )}
    </div>
  );
}

function Card({
  person,
  blur,
  stacked,
}: {
  person: NearbyPerson;
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
        <div className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
          <MapPin className="h-3.5 w-3.5" />
          {person.city ? `${person.city} · ` : ""}
          {Math.round(person.distance_miles)} mi away
        </div>
        {person.bio && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/85">{person.bio}</p>
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

// ── Sisterhood/Brotherhood: nearby list + connection requests ──────────
function NearbyList() {
  const { active } = useActiveMode();
  const meta = MODES[active];
  const [tab, setTab] = useState<"nearby" | "requests">("nearby");
  const [showSettings, setShowSettings] = useState(false);
  const { data: location } = useMyLocation();
  const { radius, setRadius } = useRadiusState();
  const coords =
    location?.latitude && location?.longitude
      ? { lat: location.latitude, lng: location.longitude }
      : null;
  const { data: nearby, isLoading } = useNearbyProfiles(active as AppMode, coords, radius);
  const sendRequest = useSendConnectionRequest(active);
  const { data: incoming } = useIncomingConnectionRequests();
  const respond = useRespondToConnectionRequest();

  const connect = async (personId: string) => {
    try {
      await sendRequest.mutateAsync(personId);
      toast.success("Connection request sent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send that request.");
    }
  };

  const respondTo = async (requestId: string, accept: boolean) => {
    try {
      await respond.mutateAsync({ requestId, accept });
      toast.success(accept ? "Connected." : "Request declined.");
    } catch {
      toast.error("Couldn't respond to that request.");
    }
  };

  return (
    <div className="px-5 pt-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="eyebrow text-muted-foreground">Discover · {meta.tagline}</p>
          <h2 className="font-display mt-1 text-3xl font-medium tracking-tight text-foreground">
            {meta.title}
          </h2>
        </div>
        {coords && (
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium shadow-[var(--shadow-soft)]"
          >
            <MapPin className="h-3.5 w-3.5" /> {radius} mi
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("nearby")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tab === "nearby"
              ? "bg-foreground text-background"
              : "border border-border text-muted-foreground"
          }`}
        >
          Nearby
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tab === "requests"
              ? "bg-foreground text-background"
              : "border border-border text-muted-foreground"
          }`}
        >
          Requests
          {!!incoming?.length && (
            <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--mode-matrimonial)] px-1 text-[10px] font-semibold text-primary-foreground">
              {incoming.length}
            </span>
          )}
        </button>
      </div>

      {tab === "nearby" && (
        <>
          {(showSettings || !coords) && (
            <div className="mb-4 space-y-3">
              <LocationPicker />
              {coords && <RadiusControl radius={radius} onChange={setRadius} />}
            </div>
          )}

          {coords && (
            <div className="space-y-3">
              {!isLoading && (!nearby || nearby.length === 0) && (
                <EmptyState
                  icon={MapPinOff}
                  title="No one nearby yet"
                  description={`No verified ${meta.title.toLowerCase()} members found within ${radius} mi.`}
                />
              )}
              {nearby?.map((p, i) => (
                <NearbyRow key={p.id} person={p} index={i} onConnect={() => connect(p.id)} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "requests" && (
        <div className="space-y-3">
          {!incoming?.length && (
            <EmptyState
              icon={Inbox}
              title="No pending requests"
              description="You're all caught up."
            />
          )}
          {incoming?.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center gap-2.5">
                {r.requester?.avatarUrl ? (
                  <img
                    src={r.requester.avatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {r.requester?.display_name ?? "Someone"}
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => respondTo(r.id, true)}
                  className="rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
                >
                  Accept
                </button>
                <button
                  onClick={() => respondTo(r.id, false)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NearbyRow({
  person,
  index,
  onConnect,
}: {
  person: NearbyPerson;
  index: number;
  onConnect: () => void;
}) {
  const status = person.connection_status;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04 }}
      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-center gap-3">
        {person.avatarUrl ? (
          <img src={person.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-muted" />
        )}
        <div className="leading-tight">
          <div className="flex items-center gap-1 font-display text-base font-medium text-foreground">
            {person.display_name ?? "Someone"}
            {person.is_verified && (
              <BadgeCheck className="h-3.5 w-3.5 text-[var(--mode-brotherhood)]" />
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" /> {Math.round(person.distance_miles)} mi away
          </div>
        </div>
      </div>
      {status === "accepted" ? (
        <span className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5" /> Connected
        </span>
      ) : status === "pending" ? (
        <span className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> Pending
        </span>
      ) : (
        <button
          onClick={onConnect}
          className="flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
        >
          <UserPlus className="h-3.5 w-3.5" /> Connect
        </button>
      )}
    </motion.div>
  );
}
