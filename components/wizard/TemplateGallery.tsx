"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TEMPLATES } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";
import type { ReportView } from "@/lib/sample";
import { sampleReport } from "@/lib/sample";
import { Cover } from "@/components/report/covers";
import { DocAccent, buildDocumentPages } from "@/components/report/ReportDocument";
import type { CompanyProfileView } from "./CompanyPicker";
import type { WizardState } from "./types";
import { ErrorNote, Spinner } from "./ui";

/** A4 at CSS 96dpi — the pages are laid out in mm, so this is exact. */
const A4_W = 794;
const A4_H = 1123;

/** Live mini-render of a real document page, scaled to fit. */
export function PageThumb({ width, children }: { width: number; children: React.ReactNode }) {
  const scale = width / A4_W;
  return (
    <div
      aria-hidden
      className="pointer-events-none select-none overflow-hidden rounded-[6px] border border-hairline bg-white"
      style={{ width, height: Math.round(A4_H * scale) }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: A4_W, height: A4_H }}>
        {children}
      </div>
    </div>
  );
}

/** Builds the preview data: the user's real details and photos, sample fallback. */
export function previewView(
  state: WizardState,
  templateId: TemplateId,
  profile?: CompanyProfileView | null,
): ReportView {
  const sample = sampleReport(templateId);
  return {
    ...sample,
    templateId,
    title: state.title.trim() || sample.title,
    building: state.building.trim() || sample.building,
    level: state.level.trim() || sample.level,
    area: state.area.trim() || sample.area,
    date: state.date || sample.date,
    preparedBy: state.preparedBy.trim() || sample.preparedBy,
    scope: state.scope.trim() || undefined,
    remarks: state.remarks.trim() || undefined,
    paired: state.paired,
    company: profile ? { name: profile.name, accent: profile.accent } : sample.company,
    buildingPhoto: state.buildingPhoto ?? sample.buildingPhoto,
    logo: profile ? { ...profile.logo, caption: undefined } : sample.logo,
    photos: {
      before: state.photos.before.length ? state.photos.before : sample.photos.before,
      during: state.photos.during.length ? state.photos.during : sample.photos.during,
      after: state.photos.after.length ? state.photos.after : sample.photos.after,
    },
  };
}

/**
 * Template gallery: a grid of covers rendered with the user's real content.
 * Tap a card to expand every page of that document below it; tick the
 * checkbox to include the template in the batch download (multi-select).
 */
export function TemplateGallery({
  state,
  profile,
  selected,
  onToggle,
  onQuickDownload,
  quickBusy,
  quickError,
}: {
  state: WizardState;
  profile?: CompanyProfileView | null;
  selected: TemplateId[];
  onToggle: (id: TemplateId) => void;
  onQuickDownload: (id: TemplateId) => void;
  /** template currently generating via quick download, if any */
  quickBusy: TemplateId | null;
  quickError: string | null;
}) {
  const [expanded, setExpanded] = useState<TemplateId | null>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (expanded) expandedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [expanded]);
  const views = useMemo(
    () => TEMPLATES.map((t) => ({ def: t, view: previewView(state, t.id, profile) })),
    [state, profile],
  );
  const expandedEntry = views.find((v) => v.def.id === expanded);
  const expandedPages = useMemo(
    () => (expandedEntry ? buildDocumentPages(expandedEntry.view) : []),
    [expandedEntry],
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {views.map(({ def, view }) => {
          const isSelected = selected.includes(def.id);
          const isExpanded = expanded === def.id;
          return (
            <div
              key={def.id}
              className={`flex flex-col rounded-[14px] border p-2.5 transition-colors ${
                isSelected ? "border-border-strong bg-bg-subtle ring-2 ring-accent" : "border-hairline bg-bg-subtle"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : def.id)}
                aria-expanded={isExpanded}
                className="group relative"
                title="Tap to preview every page"
              >
                <ResponsiveThumb>
                  <DocAccent r={view}>
                    <Cover r={view} />
                  </DocAccent>
                </ResponsiveThumb>
                <span className="absolute bottom-2 right-2 rounded-full bg-bg/95 px-2.5 py-1 text-[11px] font-medium text-text-muted shadow-card">
                  {isExpanded ? "Hide pages" : "All pages"}
                </span>
              </button>
              <div className="mt-2 flex items-start justify-between gap-2 px-0.5">
                <span className="text-[12.5px] font-medium leading-tight text-text">{def.name}</span>
                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[12px] text-text-muted">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(def.id)}
                    className="size-5 accent-current"
                    aria-label={`Select ${def.name}`}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {expandedEntry && (
        <div
          ref={expandedRef}
          className="step-enter mt-5 scroll-mt-4 rounded-[16px] border border-hairline bg-bg-subtle p-4 sm:p-5"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-[16px] font-semibold text-text">
                {expandedEntry.def.name} — all {expandedPages.length} pages
              </h3>
              <p className="mt-0.5 text-[13px] text-text-muted">{expandedEntry.def.blurb}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onQuickDownload(expandedEntry.def.id)}
                disabled={quickBusy !== null}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] bg-accent px-5 py-2.5 text-[15px] font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {quickBusy === expandedEntry.def.id ? <Spinner /> : null} Download this PDF
              </button>
            </div>
          </div>
          <ErrorNote message={quickError} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {expandedPages.map((page, i) => (
              <ResponsiveThumb key={i}>
                <DocAccent r={expandedEntry.view}>{page}</DocAccent>
              </ResponsiveThumb>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Fluid page thumbnail: fills its parent's width at the exact A4 ratio.
 * Measures its own width and scales the real page render to match.
 */
function ResponsiveThumb({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none w-full select-none overflow-hidden rounded-[6px] border border-hairline bg-white"
      style={{ aspectRatio: "210 / 297" }}
    >
      {width > 0 && (
        <div
          style={{
            transform: `scale(${width / A4_W})`,
            transformOrigin: "top left",
            width: A4_W,
            height: A4_H,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
