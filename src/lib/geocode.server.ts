import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// OpenStreetMap Nominatim — free, no API key. Their usage policy requires a
// descriptive User-Agent identifying the application (not the browser's
// default), and asks that requests come from a server rather than directly
// from end-user browsers at any real volume — both reasons this is a
// TanStack server function rather than a client-side fetch.
const USER_AGENT = "Ummah/1.0 (community app; contact: info@saber-holdings.com)";

export type GeocodeResult = {
  label: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
};

function toResult(item: {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}): GeocodeResult {
  const address = item.address ?? {};
  const city =
    address.city ??
    address.town ??
    address.village ??
    address.county ??
    item.display_name.split(",")[0];
  const country = address.country ?? "";
  return {
    label: item.display_name,
    city,
    country,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  };
}

// Manual entry: user types a city name, picks from a short list of matches
// (a bare name like "Springfield" is ambiguous across many countries).
export const searchCity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { query: string }) => {
    const trimmed = data.query.trim();
    if (trimmed.length < 2 || trimmed.length > 200) throw new Error("Invalid search query");
    return { query: trimmed };
  })
  .handler(async ({ data }): Promise<GeocodeResult[]> => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", data.query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");

    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error("Location search failed — try again.");
    const items = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      address?: Record<string, string>;
    }>;
    return items.map(toResult);
  });

// GPS path: browser gives raw coordinates, we reverse-geocode to a
// human-readable city/country for display and storage.
export const reverseGeocode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { lat: number; lng: number }) => {
    if (
      typeof data.lat !== "number" ||
      typeof data.lng !== "number" ||
      Math.abs(data.lat) > 90 ||
      Math.abs(data.lng) > 180
    ) {
      throw new Error("Invalid coordinates");
    }
    return data;
  })
  .handler(async ({ data }): Promise<GeocodeResult> => {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(data.lat));
    url.searchParams.set("lon", String(data.lng));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error("Couldn't determine your city — try entering it manually.");
    const item = (await res.json()) as {
      display_name: string;
      lat: string;
      lon: string;
      address?: Record<string, string>;
    };
    // Trust the browser's raw GPS coordinates over Nominatim's own
    // (rounds/snaps to a place centroid), only the label/city/country come
    // from the reverse lookup.
    return { ...toResult(item), lat: data.lat, lng: data.lng };
  });
