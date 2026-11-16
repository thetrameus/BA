import { NOMINATIM_BASE, NOMINATIM_USER_AGENT } from "@/shared/config";

const cache = new Map<string, string | null>();

export async function reverseGeocode(
  lat: number,
  lng: number,
  timeoutMs = 7000,
): Promise<string | null> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (cache.has(key)) return cache.get(key) ?? null;

  try {
    const url = new URL(`${NOMINATIM_BASE}/reverse`);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("accept-language", "fa");
    url.searchParams.set("zoom", "17");
    url.searchParams.set("addressdetails", "1");

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      cache.set(key, null);
      return null;
    }

    const data = await res.json();
    const a = data.address ?? {};
    const parts = [
      a.road ?? a.pedestrian ?? a.residential ?? a.footway,
      a.neighbourhood ?? a.suburb ?? a.quarter ?? a.city_district,
      a.city ?? a.town ?? a.village ?? a.county,
    ]
      .filter((v: unknown): v is string => typeof v === "string" && v.length > 1)
      .filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i);

    let text = parts.slice(0, 3).join("، ");
    if (!text && typeof data.display_name === "string") {
      text = data.display_name
        .split(/[،,]/)
        .map((s: string) => s.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join("، ");
    }

    const result = text || null;
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, null);
    return null;
  }
}