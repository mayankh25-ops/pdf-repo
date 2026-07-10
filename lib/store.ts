import { mkdirSync, existsSync } from "node:fs";
import { readFile, writeFile, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import type { ReportData, ReportRecord } from "./types";

/**
 * Local temp-file store for v1 (no DB). Layout under $TMPDIR/cwr-data:
 *   uploads/<id>.<ext> + <id>.json   — processed images + metadata
 *   jobs/<id>.json                   — report payloads for the /print route
 *   out/<token>.<ext> + <token>.json — generated PDF/DOCX with 24h expiry
 */
const ROOT = process.env.CWR_DATA_DIR || path.join(os.tmpdir(), "cwr-data");
export const DIRS = {
  uploads: path.join(ROOT, "uploads"),
  jobs: path.join(ROOT, "jobs"),
  out: path.join(ROOT, "out"),
  reports: path.join(ROOT, "reports"),
  profiles: path.join(ROOT, "profiles"),
  users: path.join(ROOT, "users"),
};
for (const dir of Object.values(DIRS)) mkdirSync(dir, { recursive: true });

export const DOWNLOAD_TTL_MS = 24 * 60 * 60 * 1000;

const id = () => crypto.randomBytes(10).toString("hex");
const safe = (name: string) => /^[a-f0-9]{16,64}$/.test(name);

export interface UploadRecord {
  id: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
}

export async function saveUpload(
  buffer: Buffer,
  ext: string,
  mime: string,
  width: number,
  height: number,
): Promise<UploadRecord> {
  const rec: UploadRecord = { id: id(), ext, mime, width, height };
  await writeFile(path.join(DIRS.uploads, `${rec.id}.${ext}`), buffer);
  await writeFile(path.join(DIRS.uploads, `${rec.id}.json`), JSON.stringify(rec));
  return rec;
}

export async function readUpload(uploadId: string) {
  if (!safe(uploadId)) return null;
  try {
    const rec: UploadRecord = JSON.parse(
      await readFile(path.join(DIRS.uploads, `${uploadId}.json`), "utf8"),
    );
    const data = await readFile(path.join(DIRS.uploads, `${rec.id}.${rec.ext}`));
    return { rec, data };
  } catch {
    return null;
  }
}

export async function saveJob(report: ReportData): Promise<string> {
  const jobId = id();
  await writeFile(path.join(DIRS.jobs, `${jobId}.json`), JSON.stringify(report));
  return jobId;
}

export async function readJob(jobId: string): Promise<ReportData | null> {
  if (!safe(jobId)) return null;
  try {
    return JSON.parse(await readFile(path.join(DIRS.jobs, `${jobId}.json`), "utf8"));
  } catch {
    return null;
  }
}

export interface OutputRecord {
  token: string;
  ext: string;
  mime: string;
  filename: string;
  /** null = kept until manually deleted (registry copies) */
  expiresAt: number | null;
}

export async function saveOutput(
  buffer: Buffer,
  ext: string,
  mime: string,
  filename: string,
  opts: { persistent?: boolean } = {},
): Promise<OutputRecord> {
  const rec: OutputRecord = {
    token: id(),
    ext,
    mime,
    filename,
    expiresAt: opts.persistent ? null : Date.now() + DOWNLOAD_TTL_MS,
  };
  await writeFile(path.join(DIRS.out, `${rec.token}.${ext}`), buffer);
  await writeFile(path.join(DIRS.out, `${rec.token}.json`), JSON.stringify(rec));
  void cleanupExpired();
  return rec;
}

export async function readOutput(token: string) {
  if (!safe(token)) return null;
  try {
    const rec: OutputRecord = JSON.parse(
      await readFile(path.join(DIRS.out, `${token}.json`), "utf8"),
    );
    if (rec.expiresAt !== null && Date.now() > rec.expiresAt) {
      await rm(path.join(DIRS.out, `${rec.token}.${rec.ext}`), { force: true });
      await rm(path.join(DIRS.out, `${rec.token}.json`), { force: true });
      return null;
    }
    const data = await readFile(path.join(DIRS.out, `${rec.token}.${rec.ext}`));
    return { rec, data };
  } catch {
    return null;
  }
}

/** Removes expired outputs and stale uploads/jobs (48h). Best-effort. */
export async function cleanupExpired() {
  try {
    for (const file of await readdir(DIRS.out)) {
      if (!file.endsWith(".json")) continue;
      try {
        const rec: OutputRecord = JSON.parse(await readFile(path.join(DIRS.out, file), "utf8"));
        if (rec.expiresAt !== null && Date.now() > rec.expiresAt) {
          await rm(path.join(DIRS.out, `${rec.token}.${rec.ext}`), { force: true });
          await rm(path.join(DIRS.out, file), { force: true });
        }
      } catch {
        /* ignore malformed records */
      }
    }
    const stale = Date.now() - 2 * DOWNLOAD_TTL_MS;
    // Profile logos and brand building photos live in uploads but must
    // never be swept.
    const keep = new Set(
      (await listProfiles()).flatMap((p) => [p.logoId, p.buildingId]).filter(Boolean),
    );
    for (const dir of [DIRS.uploads, DIRS.jobs]) {
      for (const file of await readdir(dir)) {
        if (keep.has(file.replace(/\.[^.]+$/, ""))) continue;
        const p = path.join(dir, file);
        try {
          if ((await stat(p)).mtimeMs < stale) await rm(p, { force: true });
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* best-effort */
  }
}

export function uploadPath(rec: UploadRecord) {
  return path.join(DIRS.uploads, `${rec.id}.${rec.ext}`);
}

export function existsUploadDir() {
  return existsSync(DIRS.uploads);
}

/* ---------------------------------------------------------------------------
   Company profiles — brand name + logo + accent, selectable on the home page.
   The Focused Facilities Management profile ships built in.
--------------------------------------------------------------------------- */

export interface CompanyProfile {
  id: string;
  name: string;
  accent: string;
  /** upload id of the logo, or a `builtin:` id served from /brand */
  logoId: string;
  logoWidth: number;
  logoHeight: number;
  /** multiplier for the logo size in documents (default 1) */
  logoScale: number;
  /** optional default building/hero photo (upload id) used on report covers
   *  when a report doesn't set its own */
  buildingId?: string;
  buildingWidth?: number;
  buildingHeight?: number;
  createdAt: string;
}

export const DEFAULT_PROFILE: CompanyProfile = {
  id: "focused-fm",
  name: "Focused Facilities Management",
  accent: "#D9232E",
  logoId: "builtin:focused-fm",
  logoWidth: 72,
  logoHeight: 47,
  logoScale: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const profileFile = (profileId: string) =>
  path.join(DIRS.profiles, `${profileId.replace(/[^\w-]/g, "")}.json`);

/** Built-in profile plus stored ones; an edit to the built-in overlays it. */
export async function listProfiles(): Promise<CompanyProfile[]> {
  const byId = new Map<string, CompanyProfile>([[DEFAULT_PROFILE.id, DEFAULT_PROFILE]]);
  try {
    for (const file of await readdir(DIRS.profiles)) {
      if (!file.endsWith(".json")) continue;
      try {
        const record: CompanyProfile = JSON.parse(
          await readFile(path.join(DIRS.profiles, file), "utf8"),
        );
        byId.set(record.id, { ...record, logoScale: record.logoScale ?? 1 });
      } catch {
        /* skip malformed */
      }
    }
  } catch {
    /* dir missing */
  }
  return [...byId.values()].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

/** Creates a profile, or updates one (partial fields) when `id` is given. */
export async function saveProfile(
  profile: Partial<CompanyProfile> & Pick<CompanyProfile, "name" | "accent">,
): Promise<CompanyProfile | null> {
  const existing = profile.id ? await getProfile(profile.id) : null;
  if (profile.id && !existing) return null;
  if (!existing && !profile.logoId) return null;
  const record: CompanyProfile = {
    logoId: "",
    logoWidth: 0,
    logoHeight: 0,
    logoScale: 1,
    createdAt: new Date().toISOString(),
    ...existing,
    ...profile,
    id: existing?.id ?? id(),
  };
  await writeFile(profileFile(record.id), JSON.stringify(record));
  return record;
}

export async function getProfile(profileId: string): Promise<CompanyProfile | null> {
  try {
    const record: CompanyProfile = JSON.parse(await readFile(profileFile(profileId), "utf8"));
    return { ...record, logoScale: record.logoScale ?? 1 };
  } catch {
    return profileId === DEFAULT_PROFILE.id ? DEFAULT_PROFILE : null;
  }
}

/* ---------------------------------------------------------------------------
   Building list — shared dropdown entries for the report form, so the team
   never has to retype building names.
--------------------------------------------------------------------------- */

const BUILDINGS_FILE = path.join(ROOT, "buildings.json");
const DEFAULT_BUILDINGS = ["Aurora Melbourne Central", "The Muse"];

export async function listBuildings(): Promise<string[]> {
  try {
    const list: string[] = JSON.parse(await readFile(BUILDINGS_FILE, "utf8"));
    return Array.isArray(list) ? list : DEFAULT_BUILDINGS;
  } catch {
    return DEFAULT_BUILDINGS;
  }
}

export async function saveBuildings(list: string[]): Promise<void> {
  await writeFile(BUILDINGS_FILE, JSON.stringify(list));
}

/* ---------------------------------------------------------------------------
   Report registry — every generated report gets a sequential number
   (e.g. 2026-0014) and stays on the portal for later search & download.
--------------------------------------------------------------------------- */

const COUNTER_FILE = path.join(ROOT, "report-counter.json");

export async function nextReportNo(): Promise<string> {
  const year = new Date().getFullYear();
  let counter: { year: number; seq: number } = { year, seq: 0 };
  try {
    counter = JSON.parse(await readFile(COUNTER_FILE, "utf8"));
  } catch {
    /* first report */
  }
  if (counter.year !== year) counter = { year, seq: 0 };
  counter.seq += 1;
  await writeFile(COUNTER_FILE, JSON.stringify(counter));
  return `${year}-${String(counter.seq).padStart(4, "0")}`;
}

export async function registerReport(record: ReportRecord): Promise<void> {
  await writeFile(
    path.join(DIRS.reports, `${record.reportNo.replace(/[^\w-]/g, "")}.json`),
    JSON.stringify(record),
  );
}

export async function listReports(query?: string): Promise<ReportRecord[]> {
  const records: ReportRecord[] = [];
  try {
    for (const file of await readdir(DIRS.reports)) {
      if (!file.endsWith(".json")) continue;
      try {
        records.push(JSON.parse(await readFile(path.join(DIRS.reports, file), "utf8")));
      } catch {
        /* skip malformed */
      }
    }
  } catch {
    /* dir missing */
  }
  records.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const q = query?.trim().toLowerCase();
  if (!q) return records;
  return records.filter((r) =>
    [r.reportNo, r.title, r.building, r.preparedBy ?? "", r.date]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}

/* ---------------------------------------------------------------------------
   User accounts — email + salted password hash. The env-configured admin
   account exists outside this store and always works.
--------------------------------------------------------------------------- */

export interface UserRecord {
  email: string;
  name: string;
  salt: string;
  passHash: string;
  createdAt: string;
  /** New sign-ups start "pending" until the admin approves them.
   *  Records without a status (created before approvals existed) are active. */
  status?: "pending" | "active" | "rejected";
  resetToken?: string;
  resetExpires?: number;
}

const userFile = (email: string) =>
  path.join(
    DIRS.users,
    `${crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 32)}.json`,
  );

export async function getUser(email: string): Promise<UserRecord | null> {
  try {
    return JSON.parse(await readFile(userFile(email), "utf8"));
  } catch {
    return null;
  }
}

export async function saveUser(user: UserRecord): Promise<void> {
  await writeFile(userFile(user.email), JSON.stringify(user));
}

export async function listUsers(): Promise<UserRecord[]> {
  const users: UserRecord[] = [];
  try {
    for (const file of await readdir(DIRS.users)) {
      if (!file.endsWith(".json")) continue;
      try {
        users.push(JSON.parse(await readFile(path.join(DIRS.users, file), "utf8")));
      } catch {
        /* skip malformed */
      }
    }
  } catch {
    /* dir missing */
  }
  return users.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function setUserStatus(
  email: string,
  status: "active" | "rejected",
): Promise<UserRecord | null> {
  const user = await getUser(email);
  if (!user) return null;
  user.status = status;
  await saveUser(user);
  return user;
}

export const newSalt = () => crypto.randomBytes(12).toString("hex");
export const newResetToken = () => crypto.randomBytes(16).toString("hex");
