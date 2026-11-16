import * as Application from "expo-application";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import type { VersionManifest } from "./types";

/** آدرس فایل version.json — این را با آدرس واقعی خود عوض کنید */
export const MANIFEST_URL = "https://your-domain.com/version.json";

/** مقایسه‌ی نسخه‌ها به‌صورت semantic: "1.0.5" > "1.0.4" */
function isNewer(remote: string, current: string): boolean {
  const r = remote.split(".").map((n) => parseInt(n, 10) || 0);
  const c = current.split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(r.length, c.length);
  for (let i = 0; i < len; i++) {
    const a = r[i] ?? 0;
    const b = c[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}

export function getCurrentVersion(): string {
  return Application.nativeApplicationVersion ?? "1.0.0";
}

/** چک می‌کند آیا نسخه‌ی جدید روی سرور هست یا نه */
export async function checkForUpdate(): Promise<VersionManifest | null> {
  try {
    const res = await fetch(MANIFEST_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as Partial<VersionManifest>;
    if (!data.version || !data.apkUrl) return null;

    const current = getCurrentVersion();
    if (isNewer(data.version, current)) {
      return { version: data.version, apkUrl: data.apkUrl, notes: data.notes };
    }
    return null;
  } catch (err) {
    console.warn("[Updater] check failed:", err);
    return null;
  }
}

/** دانلود APK با گزارش پیشرفت (callback) */
export async function downloadApk(
  url: string,
  onProgress: (ratio: number) => void,
): Promise<string> {
  const target = `${FileSystem.documentDirectory}update-${Date.now()}.apk`;

  const download = FileSystem.createDownloadResumable(url, target, {}, (p) => {
    if (p.totalBytesExpectedToWrite > 0) {
      onProgress(p.totalBytesWritten / p.totalBytesExpectedToWrite);
    }
  });

  const result = await download.downloadAsync();
  if (!result || !result.uri) {
    throw new Error("دانلود ناموفق بود");
  }
  return result.uri;
}

/** باز کردن نصب‌کننده‌ی سیستم برای فایل APK */
export async function installApk(fileUri: string): Promise<void> {
  const contentUri = await FileSystem.getContentUriAsync(fileUri);
  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    data: contentUri,
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    type: "application/vnd.android.package-archive",
  });
}
