// src/features/workers/store.ts
import { haversineMeters, type NearbyWorker } from "@/shared/geo";

export type MemWorker = {
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
  createdAt: Date;
};

export type MemJobRequest = {
  id: number;
  phone: string;
  address: string | null;
  description: string | null;
  lat: number;
  lng: number;
  wageAmount: number;
  hasInsurance: boolean;
  workersNeeded: number;
  amenities: string[];
  categories: string[];
  createdAt: Date;
};

type Store = {
  workers: MemWorker[];
  jobRequests: MemJobRequest[];
  _workerSeq: number;
  _jobSeq: number;
};

// ⬇️ دسته‌های مجاز — اگر store قدیمی بود، بر اساس این re-seed می‌شه
const EXPECTED_CATEGORIES = ["cleaner", "builder"] as const;

const store: Store = {
  workers: [],
  jobRequests: [],
  _workerSeq: 0,
  _jobSeq: 0,
};

// Self-healing: اگر دیتای قبلی با دسته‌های قدیمی مانده باشد، پاک و re-seed کن
function ensureFreshSeed() {
  const allMatch = store.workers.every((w) =>
    (EXPECTED_CATEGORIES as readonly string[]).includes(w.category),
  );
  if (store.workers.length === 0 || !allMatch) {
    store.workers = [];
    store._workerSeq = 0;
    seedWorkers(store);
  }
}

ensureFreshSeed();

export function nearbyWorkers(params: {
  lat: number;
  lng: number;
  radius: number;
  category?: string | null;
  limit?: number;
  onlyOnline?: boolean;
}): NearbyWorker[] {
  const { lat, lng, radius, category, limit = 60, onlyOnline = false } = params;
  const M = 111_320;
  const dLat = radius / M;
  const dLng = radius / (M * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));

  const out: NearbyWorker[] = [];
  for (const w of store.workers) {
    if (Math.abs(w.lat - lat) > dLat || Math.abs(w.lng - lng) > dLng) continue;
    if (category && w.category !== category) continue;
    if (onlyOnline && !w.isOnline) continue;
    const d = Math.round(
      haversineMeters({ lat, lng }, { lat: w.lat, lng: w.lng }),
    );
    if (d > radius) continue;
    out.push({ ...w, distance: d, createdAt: w.createdAt.toISOString() });
  }
  return out
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.min(limit, 200));
}

export function insertJobRequest(
  data: Omit<MemJobRequest, "id" | "createdAt">,
): MemJobRequest {
  store._jobSeq += 1;
  const j: MemJobRequest = {
    ...data,
    id: store._jobSeq,
    createdAt: new Date(),
  };
  store.jobRequests.push(j);
  return j;
}

export function getAllJobRequests(limit = 50): MemJobRequest[] {
  return [...store.jobRequests].reverse().slice(0, limit);
}

// ─── Debug helper (اختیاری) ───
export function _debugCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const w of store.workers) {
    counts[w.category] = (counts[w.category] ?? 0) + 1;
  }
  return counts;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedWorkers(s: Store) {
  const rand = mulberry32(42);
  const CENTER = { lat: 36.2605, lng: 59.6168 };
  const M = 111_320;

  const FIRST = [
    "علی",
    "رضا",
    "محمد",
    "حسین",
    "مهدی",
    "امیر",
    "سعید",
    "حمید",
    "بهنام",
    "فرهاد",
    "کیان",
    "ارسلان",
    "جواد",
    "مجتبی",
    "پیمان",
    "شهاب",
    "وحید",
    "داود",
    "ایوب",
    "قاسم",
    "ناصر",
    "بهرام",
    "سیامک",
    "کامران",
    "فرید",
    "منصور",
    "یاسر",
    "هادی",
    "رامین",
    "بابک",
  ];
  const LAST = [
    "محمدی",
    "کریمی",
    "حسینی",
    "رضایی",
    "موسوی",
    "جعفری",
    "احمدی",
    "صالحی",
    "نادری",
    "قاسمی",
    "رحیمی",
    "عباسی",
    "اکبری",
    "مرادی",
    "یوسفی",
    "شریفی",
    "اسدی",
    "غلامی",
    "باقری",
    "طالبی",
  ];
  const BIOS: Record<string, string[]> = {
    cleaner: ["نظافت منزل", "نظافت راه‌پله و مشاعات"],
    builder: ["بنایی و اجرا", "سفت‌کاری و خاک‌برداری"],
  };
  const CATS = Object.keys(BIOS);
  const used = new Set<string>();

  for (let i = 0; i < 160; i++) {
    let name = "";
    do {
      name = `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`;
    } while (used.has(name));
    used.add(name);

    const category = CATS[Math.floor(rand() * CATS.length)];
    const r = ((rand() + rand() + rand()) / 3) * 6500;
    const theta = rand() * Math.PI * 2;
    const lat = CENTER.lat + (Math.cos(theta) * r) / M;
    const lng =
      CENTER.lng +
      (Math.sin(theta) * r) / (M * Math.cos((CENTER.lat * Math.PI) / 180));
    const bioArr = BIOS[category] ?? ["استادکار"];

    s._workerSeq += 1;
    s.workers.push({
      id: s._workerSeq,
      name,
      phone: `0912${String(1000000 + Math.floor(rand() * 8999999))}`,
      category,
      bio: `${bioArr[Math.floor(rand() * bioArr.length)]} · ${1 + Math.floor(rand() * 22)} سال سابقه`,
      rating: Math.round((3.6 + rand() * 1.4) * 10) / 10,
      jobsDone: 12 + Math.floor(rand() * 480),
      isOnline: rand() > 0.25,
      lat,
      lng,
      createdAt: new Date(),
    });
  }
}
