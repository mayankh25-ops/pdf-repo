"use client";

import { useRef, useState } from "react";
import type { Phase } from "@/lib/types";
import { PHASES, PHASE_LABEL } from "@/lib/types";
import type { UploadedImage } from "./types";
import { uploadFiles } from "./types";
import { ErrorNote, Spinner } from "./ui";

const ZONE_COPY: Record<Phase, string> = {
  before: "Dirty or damaged areas, prior to works",
  during: "Work in progress — optional, skipped if empty",
  after: "The cleaned, completed result",
};

const DND_MIME = "application/x-cwr-photo";

export interface MovePayload {
  fromPhase: Phase;
  id: string;
}

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
  onMove,
  narrow = false,
}: {
  phase: Phase;
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  onMove: (payload: MovePayload, toPhase: Phase, toIndex: number | null) => void;
  /** true when zones sit side-by-side as columns (fewer thumbs per row) */
  narrow?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const add = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadFiles(files, "photo");
      onChange([...images, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
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
      className={`theme-card flex flex-col rounded-[16px] border bg-bg-subtle p-4 transition-colors ${
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
          <h3 className="font-mono text-[12px] font-medium tracking-[0.1em] text-text">
            {PHASE_LABEL[phase]}
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
        {busy ? (
          <span className="flex items-center gap-2 text-[14px] text-text-muted">
            <Spinner /> Processing…
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
      <ErrorNote message={error} />

      {images.length > 0 && (
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
                      {PHASE_LABEL[p]}
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
        </ul>
      )}
    </section>
  );
}
