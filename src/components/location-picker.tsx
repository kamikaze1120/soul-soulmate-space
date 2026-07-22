import { useState } from "react";
import { LocateFixed, MapPin, Search, Check } from "lucide-react";
import {
  useMyLocation,
  useSetLocationFromGPS,
  useSearchCity,
  useSetLocationFromResult,
} from "@/lib/queries/discover";
import type { GeocodeResult } from "@/lib/geocode.server";
import { toast } from "sonner";

// Shared by Discover (Sisterhood/Brotherhood nearby list + Nikah swipe deck)
// and Profile settings — one place to set location via GPS or manual city
// search, since both surfaces need the same set of actions.
export function LocationPicker({ compact }: { compact?: boolean }) {
  const { data: location, isLoading } = useMyLocation();
  const setFromGPS = useSetLocationFromGPS();
  const searchCity = useSearchCity();
  const setFromResult = useSetLocationFromResult();
  const [showManual, setShowManual] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);

  const hasLocation = !!location?.latitude && !!location?.longitude;

  const useGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Location isn't available on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await setFromGPS.mutateAsync({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          toast.success(`Location set to ${result.city}, ${result.country}`);
          setShowManual(false);
        } catch {
          toast.error("Couldn't determine your city — try entering it manually.");
        }
      },
      () => toast.error("Location permission was denied."),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const runSearch = async () => {
    if (query.trim().length < 2) return;
    try {
      const found = await searchCity.mutateAsync(query);
      setResults(found);
      if (found.length === 0) toast.info("No matching cities found.");
    } catch {
      toast.error("Search failed — try again.");
    }
  };

  const pick = async (result: GeocodeResult) => {
    try {
      await setFromResult.mutateAsync(result);
      toast.success(`Location set to ${result.city}, ${result.country}`);
      setShowManual(false);
      setResults([]);
      setQuery("");
    } catch {
      toast.error("Couldn't save that location.");
    }
  };

  return (
    <div className={compact ? "" : "rounded-2xl border border-border bg-card p-4"}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {isLoading ? (
            <span className="text-muted-foreground">Loading…</span>
          ) : hasLocation ? (
            <span className="font-medium text-foreground">
              {location?.city}
              {location?.country ? `, ${location.country}` : ""}
            </span>
          ) : (
            <span className="text-muted-foreground">Location not set</span>
          )}
        </div>
        <button
          onClick={() => setShowManual((s) => !s)}
          className="text-xs font-medium text-muted-foreground underline"
        >
          {hasLocation ? "Change" : "Set location"}
        </button>
      </div>

      {showManual && (
        <div className="mt-3 space-y-2.5">
          <button
            onClick={useGPS}
            disabled={setFromGPS.isPending}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-50"
          >
            <LocateFixed className="h-3.5 w-3.5" />
            {setFromGPS.isPending ? "Locating…" : "Use my current location"}
          </button>

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex items-center gap-1.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Type a city…"
              className="flex-1 rounded-full border border-border bg-background px-3.5 py-2 text-xs outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={runSearch}
              disabled={searchCity.isPending || query.trim().length < 2}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground disabled:opacity-50"
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-1.5">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => pick(r)}
                  disabled={setFromResult.isPending}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2 text-left text-xs hover:bg-muted disabled:opacity-50"
                >
                  <span className="truncate">{r.label}</span>
                  <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
