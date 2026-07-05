"use client";

import { useMemo } from "react";
import { TEMPLATES } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";
import type { ReportView } from "@/lib/sample";
import { sampleReport } from "@/lib/sample";
import { Cover } from "@/components/report/covers";
import type { WizardState } from "./types";

/** A4 at CSS 96dpi — the covers are laid out in mm, so this is exact. */
const A4_W = 794;
const A4_H = 1123;

/** Live mini-render of a real cover component, scaled to fit. */
export function CoverThumb({ r, width }: { r: ReportView; width: number }) {
  const scale = width / A4_W;
  return (
    <div
      aria-hidden
      className="pointer-events-none select-none overflow-hidden rounded-[6px] border border-hairline"
      style={{ width, height: Math.round(A4_H * scale) }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: A4_W, height: A4_H }}>
        <Cover r={r} />
      </div>
    </div>
  );
}

/** Builds the preview data: the user's real details, sample data as fallback. */
export function previewView(state: WizardState, templateId: TemplateId): ReportView {
  const sample = sampleReport(templateId);
  return {
    ...sample,
    templateId,
    title: state.title.trim() || sample.title,
    building: state.building.trim() || sample.building,
    date: state.date || sample.date,
    preparedBy: state.preparedBy.trim() || sample.preparedBy,
    scope: state.scope.trim() || sample.scope,
    buildingPhoto: state.buildingPhoto ?? sample.buildingPhoto,
    logo: state.logo ?? sample.logo,
  };
}

export function TemplatePicker({
  state,
  onSelect,
}: {
  state: WizardState;
  onSelect: (id: TemplateId) => void;
}) {
  const previews = useMemo(
    () => TEMPLATES.map((t) => ({ def: t, view: previewView(state, t.id) })),
    [state],
  );
  const selected = previews.find((p) => p.def.id === state.templateId) ?? previews[0];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Gallery */}
      <div className="flex gap-4 overflow-x-auto pb-2 lg:w-56 lg:flex-col lg:overflow-visible lg:pb-0">
        {previews.map(({ def, view }) => {
          const active = def.id === state.templateId;
          return (
            <button
              key={def.id}
              type="button"
              onClick={() => onSelect(def.id)}
              aria-pressed={active}
              className={`flex shrink-0 flex-col items-start gap-2 rounded-[10px] p-2 text-left transition-shadow duration-120 ${
                active ? "bg-bg-element ring-2 ring-accent" : "hover:bg-bg-hover"
              }`}
            >
              <CoverThumb r={view} width={150} />
              <span className="px-0.5">
                <span className="block text-[12.5px] font-medium leading-tight text-text">
                  {def.name}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Large preview pane */}
      <div className="flex-1">
        <div className="rounded-[16px] border border-hairline bg-bg-subtle p-4 sm:p-6">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <div>
              <h3 className="font-display text-[16px] font-semibold text-text">
                {selected.def.name}
              </h3>
              <p className="mt-0.5 text-[13px] text-text-muted">{selected.def.blurb}</p>
            </div>
            <span className="shrink-0 font-mono text-[11px] tracking-[0.08em] text-text-muted">
              A4 · COVER
            </span>
          </div>
          <div className="mx-auto w-fit max-w-full overflow-x-auto shadow-card">
            <CoverThumb r={selected.view} width={460} />
          </div>
        </div>
      </div>
    </div>
  );
}
