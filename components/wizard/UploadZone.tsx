"use client";

import { useRef, useState } from "react";
import type { Phase } from "@/lib/types";
import { PHASE_LABEL } from "@/lib/types";
import type { UploadedImage } from "./types";
import { uploadFiles } from "./types";
import { ErrorNote, Spinner } from "./ui";

const ZONE_COPY: Record<Phase, { hint: string }> = {
  before: { hint: "Dirty or damaged areas, prior to works" },
  during: { hint: "Work in progress — optional, skipped if empty" },
  after: { hint: "The cleaned, completed result" },
};

/**
 * One phase upload zone: multi-image drag-and-drop + tap-to-select
 * (multi-select works on mobile galleries), thumbnail grid with remove,
 * drag-to-reorder, per-image captions and a count badge.
 */
export function UploadZone({
  phase,
  images,
  onChange,
}: {
  phase: Phase;
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragIndex = useRef<number | null>(null);

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

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <section className="flex flex-col rounded-[16px] border border-hairline bg-bg-subtle p-4">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-mono text-[12px] font-medium tracking-[0.1em] text-text">
            {PHASE_LABEL[phase]}
          </h3>
          <p className="mt-0.5 text-[12.5px] text-text-muted">{ZONE_COPY[phase].hint}</p>
        </div>
        <span className="rounded-full bg-bg-element px-2.5 py-1 font-mono text-[11px] font-medium tracking-[0.08em] text-text-muted">
          {String(images.length).padStart(2, "0")}
        </span>
      </header>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          add(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")));
        }}
        className={`flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed px-4 py-6 text-center transition-colors ${
          dragOver ? "border-border-strong bg-bg-hover" : "border-border bg-bg hover:bg-bg-hover"
        }`}
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
            <span className="text-[12px] text-text-muted">JPEG, PNG or WebP · up to 30MB each</span>
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
        <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {images.map((img, i) => (
            <li
              key={img.id}
              draggable
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex.current !== null) reorder(dragIndex.current, i);
                dragIndex.current = null;
              }}
              className="group flex cursor-grab flex-col gap-1 active:cursor-grabbing"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-[6px] border border-hairline bg-bg-element">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="absolute inset-0 size-full object-cover"
                  draggable={false}
                />
                <span className="absolute left-1.5 top-1.5 rounded-full bg-bg px-1.5 py-0.5 font-mono text-[10px] font-medium text-text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${img.name}`}
                  onClick={() => onChange(images.filter((x) => x.id !== img.id))}
                  className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-bg text-[13px] leading-none text-text opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
              <input
                type="text"
                value={img.caption ?? ""}
                maxLength={140}
                placeholder="Caption (optional)"
                onChange={(e) =>
                  onChange(images.map((x) => (x.id === img.id ? { ...x, caption: e.target.value } : x)))
                }
                className="w-full rounded-[6px] border border-transparent bg-transparent px-1 py-0.5 text-[12px] text-text placeholder:text-text-tertiary outline-none focus:border-border"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
