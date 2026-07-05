import { mkdirSync, existsSync } from "node:fs";
import { readFile, writeFile, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import type { ReportData } from "./types";

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
  expiresAt: number;
}

export async function saveOutput(
  buffer: Buffer,
  ext: string,
  mime: string,
  filename: string,
): Promise<OutputRecord> {
  const rec: OutputRecord = {
    token: id(),
    ext,
    mime,
    filename,
    expiresAt: Date.now() + DOWNLOAD_TTL_MS,
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
    if (Date.now() > rec.expiresAt) {
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
        if (Date.now() > rec.expiresAt) {
          await rm(path.join(DIRS.out, `${rec.token}.${rec.ext}`), { force: true });
          await rm(path.join(DIRS.out, file), { force: true });
        }
      } catch {
        /* ignore malformed records */
      }
    }
    const stale = Date.now() - 2 * DOWNLOAD_TTL_MS;
    for (const dir of [DIRS.uploads, DIRS.jobs]) {
      for (const file of await readdir(dir)) {
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
