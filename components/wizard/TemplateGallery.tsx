"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";
import type { PhotoView, ReportView } from "@/lib/sample";
import { sampleReport } from "@/lib/sample";
import { Cover } from "@/components/report/covers";
import { DocAccent, buildDocumentPages } from "@/components/report/ReportDocument";
import type { CompanyProfileView } from "./CompanyPicker";
import type { WizardState } from "./types";

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

/** Builds the preview data: the user's real details and photos, sample fallback.
 *  `hero` is the selected building's default photo, if it has one. */
export function previewView(
  state: WizardState,
  templateId: TemplateId,
  profile?: CompanyProfileView | null,
  hero?: PhotoView | null,
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
    currentSituation: state.currentSituation.trim() || sample.currentSituation,
    rectifications: state.rectifications.trim() || sample.rectifications,
    recommendations: state.recommendations.trim() || sample.recommendations,
    paired: state.paired,
    company: profile
      ? { name: profile.name, accent: profile.accent, logoScale: profile.logoScale }
      : sample.company,
    buildingPhoto: state.buildingPhoto ?? hero ?? profile?.building ?? sample.buildingPhoto,
    logo: profile ? { ...profile.logo, caption: undefined } : sample.logo,
    photos: {
      before: state.photos.before.length ? state.photos.before : sample.photos.before,
      during: state.photos.during.length ? state.photos.during : sample.photos.during,
      after: state.photos.after.length ? state.photos.after : sample.photos.after,
      general: state.photos.general,
    },
  };
}

/**
 * The template step: one big preview of the current (default) template with
 * ◀ ▶ arrows to flip through every page of the compiled report. The full
 * multi-select gallery stays hidden behind "Use a different template".
 */
export function TemplatePreview({
  state,
  profile,
  hero,
  selected,
  onToggle,
}: {
  state: WizardState;
  profile?: CompanyProfileView | null;
  hero?: PhotoView | null;
  selected: TemplateId[];
  onToggle: (id: TemplateId) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // Page index keyed by template so switching templates restarts at the cover.
  const [pager, setPager] = useState<{ templateId: TemplateId | null; idx: number }>({
    templateId: null,
    idx: 0,
  });
  const templateId = selected[0] ?? "improvement";
  const view = useMemo(
    () => previewView(state, templateId, profile, hero),
    [state, templateId, profile, hero],
  );
  const pages = useMemo(() => buildDocumentPages(view), [view]);
  const idx =
    pager.templateId === templateId ? Math.min(pager.idx, pages.length - 1) : 0;
  const setPageIdx = (next: (i: number) => number) =>
    setPager({ templateId, idx: next(idx) });

  const arrowCls =
    "flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-bg-subtle text-[16px] text-text shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-colors hover:bg-bg-hover disabled:opacity-30 disabled:shadow-none";

  return (
    <div>
      <div className="mx-auto flex max-w-md items-center gap-2.5 sm:gap-4">
        <button
          type="button"
          aria-label="Previous page"
          disabled={idx === 0}
          onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
          className={arrowCls}
        >
          ◀
        </button>
        <div className="min-w-0 flex-1">
          <ResponsiveThumb>
            <DocAccent r={view}>{pages[idx]}</DocAccent>
          </ResponsiveThumb>
        </div>
        <button
          type="button"
          aria-label="Next page"
          disabled={idx >= pages.length - 1}
          onClick={() => setPageIdx((i) => Math.min(pages.length - 1, i + 1))}
          className={arrowCls}
        >
          ▶
        </button>
      </div>

      <p className="mt-3 text-center text-[13px] text-text-muted">
        <span className="font-semibold text-text">{getTemplate(templateId).name}</span>
        {" · "}Page {idx + 1} of {pages.length}
        {selected.length > 1 && (
          <span> · {selected.length} templates selected</span>
        )}
      </p>

      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="min-h-11 rounded-[12px] border border-border bg-bg-subtle px-4 text-[14px] font-semibold text-text transition-colors hover:bg-bg-hover"
        >
          {expanded ? "Hide templates ▴" : "Use a different template ▾"}
        </button>
      </div>

      {expanded && (
        <div className="step-enter mt-4">
          <TemplateGallery
            state={state}
            profile={profile}
            hero={hero}
            selected={selected}
            onToggle={onToggle}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Template gallery: a grid of first-page (cover) previews rendered with the
 * user's real content. Tap a card to select it — multi-select is allowed; the
 * full compiled report is shown on the final step.
 */
export function TemplateGallery({
  state,
  profile,
  hero,
  selected,
  onToggle,
}: {
  state: WizardState;
  profile?: CompanyProfileView | null;
  hero?: PhotoView | null;
  selected: TemplateId[];
  onToggle: (id: TemplateId) => void;
}) {
  const views = useMemo(
    () => TEMPLATES.map((t) => ({ def: t, view: previewView(state, t.id, profile, hero) })),
    [state, profile, hero],
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
      {views.map(({ def, view }) => {
        const isSelected = selected.includes(def.id);
        return (
          <button
            key={def.id}
            type="button"
            onClick={() => onToggle(def.id)}
            aria-pressed={isSelected}
            className={`flex flex-col rounded-[14px] border p-2.5 text-left transition-all ${
              isSelected
                ? "border-accent bg-bg-subtle ring-1 ring-accent shadow-[0_6px_18px_rgba(0,122,255,0.14)]"
                : "border-hairline bg-bg-subtle hover:border-border"
            }`}
          >
            <ResponsiveThumb>
              <DocAccent r={view}>
                <Cover r={view} />
              </DocAccent>
            </ResponsiveThumb>
            <span className="mt-2 flex items-center justify-between gap-2 px-0.5">
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold leading-tight text-text">
                  {def.name}
                </span>
                {def.id === "improvement" && (
                  <span className="mt-0.5 block text-[10px] font-bold tracking-[0.06em] text-text-tertiary">
                    DEFAULT
                  </span>
                )}
              </span>
              <span
                aria-hidden
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[13px] ${
                  isSelected
                    ? "border-accent bg-accent text-accent-contrast"
                    : "border-border text-transparent"
                }`}
              >
                ✓
              </span>
            </span>
          </button>
        );
      })}
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
