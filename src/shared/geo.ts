// Port of lib/geo.ts — single source of truth for types, helpers, categories.

export type WorkerDTO = {
  id: number;
  name: string;
  phone: string;
  category: string;
  bio: string | null;
  rating: number;
  jobsDone: number;
  isOnline: boolean;
  lat: number;
  lng: number;
  createdAt: string | Date;
};

export type NearbyWorker = WorkerDTO & { distance: number };

export type NearbyResponse = {
  center: { lat: number; lng: number };
  radius: number;
  count: number;
  workers: NearbyWorker[];
};

export type LatLng = { lat: number; lng: number };

export const FALLBACK_CENTER: LatLng = { lat: 36.2605, lng: 59.6168 };

export const CATEGORY_INFO: Record<string, { label: string; color: string }> = {
  cleaner: { label: "نیروی نظافتی", color: "#06b6d4" },
  builder: { label: "نیروی ساختمانی", color: "#f97316" },
};

export const CATEGORIES = Object.keys(CATEGORY_INFO);
export function categoryLabel(c: string): string {
  return CATEGORY_INFO[c]?.label ?? c;
}

export function categoryColor(c: string): string {
  return CATEGORY_INFO[c]?.color ?? "#94a3b8";
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} متر`;
  const km = Math.round((meters / 1000) * 10) / 10;
  return `${km.toLocaleString("fa-IR")} کیلومتر`;
}

export function faNumber(n: number): string {
  return n.toLocaleString("fa-IR");
}

export function faToman(n: number): string {
  return n.toLocaleString("fa-IR");
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371008.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export type JobRequestPayload = {
  phone: string;
  address?: string;
  description?: string;
  lat: number;
  lng: number;
  wageAmount: number;
  hasInsurance: boolean;
  workersNeeded: number;
  amenities: string[];
  categories: string[];
};

export const AMENITY_KEYS = [
  "breakfast",
  "lunch",
  "dinner",
  "transport",
  "bonus",
] as const;
export type AmenityKey = (typeof AMENITY_KEYS)[number];

export const AMENITY_LABEL: Record<AmenityKey, string> = {
  breakfast: "صبحانه",
  lunch: "ناهار",
  dinner: "شام",
  transport: "ایاب و ذهاب",
  bonus: "پاداش",
};
