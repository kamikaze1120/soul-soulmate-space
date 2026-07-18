import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  LocateFixed,
} from "lucide-react";
import { useActiveMode } from "@/lib/active-mode";
import { useAuth } from "@/lib/auth";
import { useDiscoverDeck, type DiscoverPerson } from "@/lib/queries/discover";
import {
  useNearbyProfiles,
  useSaveMyLocation,
  useSendConnectionRequest,
  useIncomingConnectionRequests,
  useRespondToConnectionRequest,
  type NearbyPerson,
} from "@/lib/queries/discover";
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
  const { isWali } = useAuth();

  if (isWali) {
    return (
      <div className="px-5 pt-6">
        <EmptyState
          title="Not available for Wali accounts"
          description="Wali accounts can view and comment on posts, and take part in the conversation they were invited to — but can't start new connections."
        />
      </div>
    );
  }

  return active === "matrimonial" ? <SwipeDeck /> : <NearbyList />;
}

// ── Nikah: original swipe deck ──────────────────────────────────────────
function SwipeDeck() {
  const { active } = useActiveMode();
  const { data: deck, isLoading } = useDiscoverDeck(active);
  const startThread = useStartDmThread();
  const [index, setIndex] = useState(0);
  const [blur, setBlur] = useState(true);

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
        <button
          onClick={() => setBlur((b) => !b)}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium shadow-[var(--shadow-soft)]"
        >
          {blur ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {blur ? "Modesty on" : "Modesty off"}
        </button>
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

// ── Sisterhood/Brotherhood: nearby list + connection requests ──────────
function NearbyList() {
  const { active } = useActiveMode();
  const meta = MODES[active];
  const [tab, setTab] = useState<"nearby" | "requests">("nearby");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const saveLocation = useSaveMyLocation();
  const { data: nearby, isLoading } = useNearbyProfiles(active, coords);
  const sendRequest = useSendConnectionRequest(active);
  const { data: incoming } = useIncomingConnectionRequests();
  const respond = useRespondToConnectionRequest();

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location isn't available on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        saveLocation.mutate(c);
        setLocating(false);
      },
      () => {
        setLocationDenied(true);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

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
      <div className="mb-4">
        <p className="eyebrow text-muted-foreground">Discover · {meta.tagline}</p>
        <h2 className="font-display mt-1 text-3xl font-medium tracking-tight text-foreground">
          {meta.title}
        </h2>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("nearby")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tab === "nearby" ? "bg-foreground text-background" : "border border-border text-muted-foreground"
          }`}
        >
          Nearby
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tab === "requests" ? "bg-foreground text-background" : "border border-border text-muted-foreground"
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
          {!coords && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
              <LocateFixed className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Share your location to see {meta.title.toLowerCase()} members near you.
              </p>
              <button
                onClick={requestLocation}
                disabled={locating}
                className="mt-4 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-50"
              >
                {locating ? "Locating…" : "Enable location"}
              </button>
              {locationDenied && (
                <p className="mt-2 text-[11px] text-destructive">
                  Location permission was denied — check your browser/device settings.
                </p>
              )}
            </div>
          )}

          {coords && (
            <div className="space-y-3">
              {!isLoading && (!nearby || nearby.length === 0) && (
                <EmptyState
                  title="No one nearby yet"
                  description={`No verified ${meta.title.toLowerCase()} members found near you.`}
                />
              )}
              {nearby?.map((p) => <NearbyRow key={p.id} person={p} onConnect={() => connect(p.id)} />)}
            </div>
          )}
        </>
      )}

      {tab === "requests" && (
        <div className="space-y-3">
          {!incoming?.length && (
            <EmptyState title="No pending requests" description="You're all caught up." />
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

function NearbyRow({ person, onConnect }: { person: NearbyPerson; onConnect: () => void }) {
  const status = person.connection_status;
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-3">
        {person.avatarUrl ? (
          <img src={person.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-muted" />
        )}
        <div className="leading-tight">
          <div className="flex items-center gap-1 font-display text-base font-medium text-foreground">
            {person.display_name ?? "Someone"}
            {person.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-[var(--mode-brotherhood)]" />}
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
    </div>
  );
}
