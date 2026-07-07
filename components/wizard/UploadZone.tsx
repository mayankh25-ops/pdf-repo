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
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const uploading = queue.some((q) => q.progress >= 0);

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
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-mono text-[14px] font-bold tracking-[0.12em] text-text">
            {ZONE_TITLE[phase]}
          </h3>
          <p className="mt-0.5 text-[12.5px] text-text-muted">{ZONE_COPY[phase]}</p>
        </div>
        <span className="rounded-full bg-bg-element px-2.5 py-1 font-mono text-[11px] font-medium tracking-[0.08em] text-text-muted">
          {String(images.length).padStart(2, "0")}
        </span>
      </header>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-border bg-bg px-4 py-4 text-center transition-colors hover:bg-bg-hover"
      >
        {uploading ? (
          <span className="flex items-center gap-2 text-[14px] text-text-muted">
            <Spinner /> Uploading {queue.filter((q) => q.progress >= 0).length} photo
            {queue.filter((q) => q.progress >= 0).length === 1 ? "" : "s"}…
          </span>
        ) : (
          <>
            <span className="text-[14px] font-medium text-text">
              Drop photos here or tap to select
            </span>
            <span className="text-[12px] text-text-muted">
              JPEG, PNG or WebP · drag photos between sections to move them
            </span>
          </>
        )}
      </button>
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
    </section>
  );
}
