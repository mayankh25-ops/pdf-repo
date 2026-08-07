"use client";

import { useRef, useState } from "react";
import type { Phase } from "@/lib/types";
import { PHASES } from "@/lib/types";
import type { UploadedImage } from "./types";
import { uploadSingle } from "./types";
import { Spinner } from "./ui";

const ZONE_COPY: Record<Phase, string> = {
  before: "Dirty or damaged areas, prior to works",
  during: "Work in progress — optional, skipped if empty",
  after: "The cleaned, completed result",
  general: "No tag — these photos appear without any label",
};

/** Zone titles; documents use PHASE_LABEL (blank = untagged). */
const ZONE_TITLE: Record<Phase, string> = {
  before: "BEFORE",
  during: "DURING WORK",
  after: "AFTER",
  general: "NO TAG",
};

/** Zone dot colours (design handoff); general renders as an outlined dot. */
const ZONE_DOT: Record<Phase, string | null> = {
  before: "var(--tag-before)",
  during: "var(--tag-during)",
  after: "var(--tag-after)",
  general: null,
};

const DND_MIME = "application/x-cwr-photo";

export interface MovePayload {
  fromPhase: Phase;
  id: string;
}

interface QueueItem {
  key: string;
  file: File;
  previewUrl: string;
  /** 0..1 while uploading; -1 = failed */
  progress: number;
  error?: string;
}

let queueSeq = 0;

/**
 * One phase upload zone: multi-image drag-and-drop + tap-to-select, large
 * thumbnail grid, drag-to-reorder AND drag-between-zones (drop a photo on any
 * other zone to move it there before submitting), per-image captions, remove,
 * count badge. A phase selector on each thumbnail covers touch devices where
 * HTML5 drag-and-drop is unavailable.
 */
export function UploadZone({
  phase,
  images,
  onChange,
  onAppend,
  onMove,
  narrow = false,
}: {
  phase: Phase;
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  /** appends uploaded images via a functional state update (never stale) */
  onAppend: (images: UploadedImage[]) => void;
  onMove: (payload: MovePayload, toPhase: Phase, toIndex: number | null) => void;
  /** true when zones sit side-by-side as columns (fewer thumbs per row) */
  narrow?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const uploading = queue.some((q) => q.progress >= 0);
  const empty = images.length === 0 && queue.length === 0;

  const setItem = (key: string, patch: Partial<QueueItem>) =>
    setQueue((prev) => prev.map((q) => (q.key === key ? { ...q, ...patch } : q)));

  /** Uploads one queued item; on success appends the image and drops the tile. */
  const uploadItem = async (item: QueueItem) => {
    setItem(item.key, { progress: 0, error: undefined });
    try {
      const img = await uploadSingle(item.file, "photo", (fraction) =>
        setItem(item.key, { progress: Math.min(0.99, fraction) }),
      );
      onAppend([img]);
      URL.revokeObjectURL(item.previewUrl);
      setQueue((prev) => prev.filter((q) => q.key !== item.key));
    } catch (e) {
      setItem(item.key, {
        progress: -1,
        error: e instanceof Error ? e.message : "Upload failed.",
      });
    }
  };

  /** Queues files and uploads them with limited concurrency (2 at a time). */
  const add = (files: File[]) => {
    if (!files.length) return;
    const items: QueueItem[] = files.map((file) => ({
      key: `q${queueSeq++}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
    }));
    setQueue((prev) => [...prev, ...items]);
    let next = 0;
    const worker = async () => {
      while (next < items.length) {
        const item = items[next++];
        await uploadItem(item);
      }
    };
    void worker();
    if (items.length > 1) void worker();
  };

  const parsePayload = (e: React.DragEvent): MovePayload | null => {
    try {
      const raw = e.dataTransfer.getData(DND_MIME);
      return raw ? (JSON.parse(raw) as MovePayload) : null;
    } catch {
      return null;
    }
  };

  const handleZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const payload = parsePayload(e);
    if (payload) {
      onMove(payload, phase, null);
      return;
    }
    add(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")));
  };

  return (
    <section
      className={`flex flex-col rounded-[16px] border bg-bg-subtle p-4 transition-colors ${
        dragOver ? "border-border-strong" : "border-hairline"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragOver(false);
      }}
      onDrop={handleZoneDrop}
    >
      <header className="mb-3 flex items-start gap-2.5">
        <span
          aria-hidden
          className="mt-[5px] size-2 shrink-0 rounded-full"
          style={
            ZONE_DOT[phase]
              ? { background: ZONE_DOT[phase] }
              : { border: "1.5px solid var(--text-tertiary)" }
          }
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-mono text-[13.5px] font-extrabold tracking-[0.1em] text-text">
            {ZONE_TITLE[phase]}
          </h3>
          <p className="mt-0.5 text-[12.5px] text-text-muted">{ZONE_COPY[phase]}</p>
        </div>
        <span className="shrink-0 text-[13px] text-text-tertiary">
          {images.length} photo{images.length === 1 ? "" : "s"}
        </span>
      </header>

      {empty && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mb-3 flex flex-col items-center gap-1 rounded-[14px] border-[1.5px] border-dashed border-border px-4 py-5 text-center transition-colors hover:bg-bg-hover"
        >
          <span className="text-[14px] text-text-muted">No photos yet</span>
          <span className="text-[12px] text-text-tertiary">
            Drop photos here, take one, or add from your library
          </span>
        </button>
      )}
      {uploading && (
        <span className="mb-2 flex items-center gap-2 text-[13px] text-text-muted">
          <Spinner /> Uploading {queue.filter((q) => q.progress >= 0).length} photo
          {queue.filter((q) => q.progress >= 0).length === 1 ? "" : "s"}…
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          add(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        hidden
        onChange={(e) => {
          add(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      {(images.length > 0 || queue.length > 0) && (
        <ul
          className={`mt-4 grid gap-4 ${
            narrow ? "grid-cols-1 2xl:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {images.map((img, i) => (
            <li
              key={img.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(DND_MIME, JSON.stringify({ fromPhase: phase, id: img.id }));
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(false);
                const payload = parsePayload(e);
                if (payload) onMove(payload, phase, i);
              }}
              className="group flex cursor-grab flex-col gap-1.5 active:cursor-grabbing"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] border border-hairline bg-bg-element">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="absolute inset-0 size-full object-contain"
                  draggable={false}
                />
                <span className="absolute left-2 top-2 rounded-full bg-bg px-2 py-0.5 font-mono text-[10.5px] font-medium text-text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${img.name}`}
                  onClick={() => onChange(images.filter((x) => x.id !== img.id))}
                  className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-bg text-[17px] leading-none text-text shadow-card"
                >
                  ×
                </button>
                {/* Print-size picker: full page / 2 per page / 4 per page */}
                <select
                  aria-label="Print size in the report"
                  value={img.size ?? "auto"}
                  onChange={(e) =>
                    onChange(
                      images.map((x) =>
                        x.id === img.id
                          ? { ...x, size: e.target.value as UploadedImage["size"] }
                          : x,
                      ),
                    )
                  }
                  className="absolute bottom-2 left-2 min-h-9 rounded-[8px] border border-border bg-bg px-2 py-1.5 font-mono text-[11px] font-medium tracking-[0.06em] text-text-muted"
                >
                  <option value="auto">AUTO SIZE</option>
                  <option value="full">FULL PAGE</option>
                  <option value="half">2 / PAGE</option>
                  <option value="quarter">4 / PAGE</option>
                </select>
                {/* Touch-friendly mover: works where drag-and-drop doesn't */}
                <select
                  aria-label="Move photo to section"
                  value={phase}
                  onChange={(e) =>
                    onMove({ fromPhase: phase, id: img.id }, e.target.value as Phase, null)
                  }
                  className="absolute bottom-2 right-2 min-h-9 rounded-[8px] border border-border bg-bg px-2 py-1.5 font-mono text-[11px] font-medium tracking-[0.06em] text-text-muted"
                >
                  {PHASES.map((p) => (
                    <option key={p} value={p}>
                      {ZONE_TITLE[p]}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={img.caption ?? ""}
                maxLength={140}
                placeholder="Caption (optional)"
                onChange={(e) =>
                  onChange(
                    images.map((x) => (x.id === img.id ? { ...x, caption: e.target.value } : x)),
                  )
                }
                className="w-full rounded-[6px] border border-transparent bg-transparent px-1 py-1 text-[16px] text-text placeholder:text-text-tertiary outline-none focus:border-border sm:text-[13px]"
              />
            </li>
          ))}
          {queue.map((item) => (
            <li key={item.key} className="flex flex-col gap-1.5">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] border border-hairline bg-bg-element">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="absolute inset-0 size-full object-contain opacity-50"
                  draggable={false}
                />
                {item.progress >= 0 ? (
                  <>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-bg/90 px-3 py-1.5 font-mono text-[12px] font-medium text-text shadow-card">
                        {Math.round(item.progress * 100)}%
                      </span>
                    </span>
                    <span className="absolute inset-x-0 bottom-0 h-1.5 bg-bg-hover">
                      <span
                        className="block h-full bg-accent transition-[width] duration-200"
                        style={{ width: `${Math.round(item.progress * 100)}%` }}
                      />
                    </span>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => uploadItem(item)}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-bg/85 px-3 text-center"
                  >
                    <span className="text-[13.5px] font-semibold text-text">Upload failed — tap to retry</span>
                    <span className="text-[11.5px] leading-snug text-text-muted">{item.error}</span>
                  </button>
                )}
              </div>
              <span className="truncate px-1 text-[12px] text-text-muted">{item.file.name}</span>
            </li>
          ))}
        </ul>
      )}

      <div className={`flex gap-2.5 ${empty ? "" : "mt-4"}`}>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-text text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          <svg width="19" height="17" viewBox="0 0 24 21" aria-hidden>
            <rect x="1" y="4" width="22" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M8 4l1.6-2.6h4.8L16 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          Take photo
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-[46px] flex-1 items-center justify-center rounded-[12px] border border-border bg-bg-subtle text-[14px] font-semibold text-text transition-colors hover:bg-bg-hover"
        >
          Add from library
        </button>
      </div>
    </section>
  );
}
