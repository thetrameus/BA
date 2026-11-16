// src/features/routing/osrm.ts
import { OSRM_BASE } from "@/shared/config";

export type Coord = [number, number]; // [lng, lat]

export type DirectionsResponse = {
  coords: Coord[];
  distance: number;
  duration: number;
  steps: { text: string; distance: number }[];
  fallback: boolean;
};

const MANEUVER_FA: Record<string, string> = {
  depart: "شروع مسیر",
  arrive: "رسیدن به مقصد",
  turn: "بپیچید",
  "new name": "ادامه دهید",
  continue: "مستقیم ادامه دهید",
  merge: "ادغام شوید",
  "on ramp": "وارد رمپ شوید",
  "off ramp": "از رمپ خارج شوید",
  fork: "در دوراهی",
  "end of road": "انتهای خیابان",
  roundabout: "وارد میدان شوید",
  rotary: "وارد میدان شوید",
  "roundabout turn": "در میدان بپیچید",
};

const MODIFIER_FA: Record<string, string> = {
  left: "به چپ",
  right: "به راست",
  "slight left": "کمی به چپ",
  "slight right": "کمی به راست",
  "sharp left": "کاملاً به چپ",
  "sharp right": "کاملاً به راست",
  straight: "مستقیم",
  uturn: "دور بزنید",
};

function haversine(a: Coord, b: Coord) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * خط مستقیم interpolate‌شده (۶۰ نقطه) به‌عنوان fallback.
 * بدون interpolation، شبیه‌سازی حرکت با ۲ نقطه فقط یک تیک می‌خورد.
 */
function buildStraightRoute(f: Coord, t: Coord): DirectionsResponse {
  const d = haversine(f, t);
  const N = 60;
  const coords: Coord[] = [];
  for (let i = 0; i <= N; i++) {
    const ratio = i / N;
    coords.push([f[0] + (t[0] - f[0]) * ratio, f[1] + (t[1] - f[1]) * ratio]);
  }
  return {
    coords,
    distance: Math.round(d),
    duration: Math.round(d / 1.35),
    steps: [{ text: "مسیر مستقیم تا مقصد", distance: Math.round(d) }],
    fallback: true,
  };
}

function buildUrl(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  return (
    `${OSRM_BASE}/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson&steps=true&alternatives=false`
  );
}

function parseResponse(data: any): DirectionsResponse | null {
  const route = data?.routes?.[0];
  if (data?.code !== "Ok" || !route?.geometry?.coordinates?.length) {
    return null;
  }

  const steps = (route.legs?.[0]?.steps ?? [])
    .map((s: any) => {
      const type = s.maneuver?.type ?? "continue";
      const mod = s.maneuver?.modifier;
      const base = MANEUVER_FA[type] ?? "ادامه دهید";
      const dir = mod ? MODIFIER_FA[mod] : undefined;
      const name =
        s.name && s.name.trim().length > 1 ? ` به ${s.name.trim()}` : "";
      const text =
        type === "depart" || type === "arrive"
          ? base
          : `${base}${dir ? ` ${dir}` : ""}${name}`;
      return { text, distance: Math.round(s.distance) };
    })
    .filter((s: any) => s.text.length > 0)
    .slice(0, 40);

  return {
    coords: route.geometry.coordinates,
    distance: Math.round(route.distance),
    duration: Math.round(route.duration),
    steps,
    fallback: false,
  };
}

export async function getDirections(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  timeoutMs = 30000, // ← از 15000 به 30000 افزایش یافت
): Promise<DirectionsResponse> {
  const f: Coord = [from.lng, from.lat];
  const t: Coord = [to.lng, to.lat];
  const url = buildUrl(from, to);

  // تلاش اول
  const attempt = async (label: string): Promise<DirectionsResponse | null> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: {
          // ⬇️ User-Agent ضروری — سرور demo OSRM گاهی درخواست‌های بدون UA را بلاک می‌کند
          "User-Agent": "KheshtApp/1.0 (React Native; Android)",
          Accept: "application/json",
        },
      });
      clearTimeout(timer);

      if (!res.ok) {
        console.warn(`[OSRM][${label}] non-OK:`, res.status, res.statusText);
        return null;
      }

      const data = await res.json();
      const parsed = parseResponse(data);
      if (!parsed) {
        console.warn(`[OSRM][${label}] invalid payload: code=${data?.code}`);
        return null;
      }
      console.log(
        `[OSRM][${label}] OK — distance=${parsed.distance}m, points=${parsed.coords.length}`,
      );
      return parsed;
    } catch (err: any) {
      clearTimeout(timer);
      const reason =
        err?.name === "AbortError"
          ? `timeout ${timeoutMs}ms`
          : String(err?.message ?? err);
      console.warn(`[OSRM][${label}] failed:`, reason);
      return null;
    }
  };

  // تلاش اول
  const first = await attempt("try-1");
  if (first) return first;

  // تلاش دوم بعد از ۱.۵ ثانیه تاخیر
  await new Promise((r) => setTimeout(r, 1500));
  const second = await attempt("try-2");
  if (second) return second;

  // fallback خط مستقیم
  console.warn("[OSRM] falling back to straight line");
  return buildStraightRoute(f, t);
}
