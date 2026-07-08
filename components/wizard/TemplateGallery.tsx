"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TEMPLATES } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";
import type { ReportView } from "@/lib/sample";
import { sampleReport } from "@/lib/sample";
import { Cover } from "@/components/report/covers";
import { DocAccent } from "@/components/report/ReportDocument";
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
    company: profile
      ? { name: profile.name, accent: profile.accent, logoScale: profile.logoScale }
      : sample.company,
    buildingPhoto: state.buildingPhoto ?? profile?.building ?? sample.buildingPhoto,
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
 * Template gallery: a grid of first-page (cover) previews rendered with the
 * user's real content. Tap a card to select it — multi-select is allowed; the
 * full compiled report is shown on the final step.
 */
export function TemplateGallery({
  state,
  profile,
  selected,
  onToggle,
}: {
  state: WizardState;
  profile?: CompanyProfileView | null;
  selected: TemplateId[];
  onToggle: (id: TemplateId) => void;
}) {
  const views = useMemo(
    () => TEMPLATES.map((t) => ({ def: t, view: previewView(state, t.id, profile) })),
    [state, profile],
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
                ? "border-accent bg-bg-subtle ring-1 ring-accent shadow-[0_6px_18px_rgba(217,35,46,0.12)]"
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
                {def.id === "focused-card" && (
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
