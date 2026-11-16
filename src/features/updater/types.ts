export type VersionManifest = {
  version: string;
  apkUrl: string;
  notes?: string;
};

export type UpdateState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; manifest: VersionManifest }
  | { status: "downloading"; manifest: VersionManifest; progress: number }
  | { status: "installing"; manifest: VersionManifest }
  | { status: "error"; message: string }
  | { status: "up-to-date" };
