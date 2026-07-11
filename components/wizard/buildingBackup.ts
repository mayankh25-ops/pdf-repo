"use client";

/**
 * Browser-side safety net for the shared building list. The server keeps
 * buildings on disk, but without a persistent volume a redeploy wipes them.
 * Every building added from this device is mirrored to localStorage
 * (name + compressed photo as a data URL); on load, anything the server
 * lost is silently re-uploaded and re-registered.
 *
 * A Railway volume is still the proper fix — this restores from whichever
 * device added the buildings.
 */
import { compressImage, uploadFiles } from "./types";
import type { BuildingView } from "./types";

const KEY = "cwr-buildings-backup-v1";

interface BuildingBackup {
  name: string;
  dataUrl?: string;
}

function read(): BuildingBackup[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function write(list: BuildingBackup[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota exceeded — drop the oldest photo payloads and retry once */
    try {
      const slim = list.map((b, i) => (i < list.length - 5 ? { name: b.name } : b));
      localStorage.setItem(KEY, JSON.stringify(slim));
    } catch {
      /* give up silently */
    }
  }
}

export async function backupBuilding(name: string, file: File | null): Promise<void> {
  const entry: BuildingBackup = { name };
  if (file) {
    try {
      const { blob } = await compressImage(file);
      if (blob.size < 1_200_000) {
        entry.dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(blob);
        });
      }
    } catch {
      /* keep the name-only backup */
    }
  }
  write([...read().filter((b) => b.name.toLowerCase() !== name.toLowerCase()), entry]);
}

export function removeBackup(name: string): void {
  write(read().filter((b) => b.name.toLowerCase() !== name.toLowerCase()));
}

/**
 * Re-creates buildings the server lost. Returns the refreshed server list
 * when anything was restored, or null when everything was already intact.
 */
export async function restoreBuildings(server: BuildingView[]): Promise<BuildingView[] | null> {
  const backups = read();
  if (!backups.length) return null;
  let restored: BuildingView[] | null = null;
  for (const b of backups) {
    const existing = server.find((s) => s.name.toLowerCase() === b.name.toLowerCase());
    if (existing && (existing.photo || !b.dataUrl)) continue; // intact
    try {
      let photoMeta: Record<string, unknown> = {};
      if (b.dataUrl) {
        const blob = await (await fetch(b.dataUrl)).blob();
        const file = new File([blob], `${b.name.replace(/[^\w-]+/g, "_")}.jpg`, {
          type: blob.type || "image/jpeg",
        });
        const [img] = await uploadFiles([file], "building");
        photoMeta = { photoId: img.id, photoWidth: img.width, photoHeight: img.height };
      }
      const res = await fetch("/api/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add: b.name, ...photoMeta }),
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.buildings)) restored = json.buildings;
    } catch {
      /* best-effort; try the next backup */
    }
  }
  return restored;
}
