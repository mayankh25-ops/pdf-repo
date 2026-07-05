"use client";

import { useEffect, useRef, useState } from "react";
import { PHASES } from "@/lib/types";
import type { UploadedImage, WizardState } from "@/components/wizard/types";
import { initialState, uploadFiles } from "@/components/wizard/types";
import { Field, GhostButton, PrimaryButton, Spinner, ErrorNote, inputCls } from "@/components/wizard/ui";
import { UploadZone } from "@/components/wizard/UploadZone";
import { TemplatePicker } from "@/components/wizard/TemplatePicker";

const STEPS = ["Details", "Template", "Photos", "Generate"] as const;

interface GenResult {
  pdfUrl: string;
  docxUrl: string;
  expiresAt: string;
}

export default function Home() {
  const [state, setState] = useState<WizardState>(initialState);
  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const totalPhotos = PHASES.reduce((n, p) => n + state.photos[p].length, 0);
  const canLeaveStep1 = state.title.trim().length > 0 && state.building.trim().length > 0;
  const canGenerate = canLeaveStep1 && totalPhotos > 0;

  const go = (step: WizardState["step"]) => {
    setState((s) => ({ ...s, step }));
    window.scrollTo({ top: 0 });
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <header className="mb-8">
        <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-text-muted">
          CLEANING WORKS REPORT GENERATOR
        </p>
        <h1 className="mt-2 font-display text-[26px] font-semibold tracking-[-0.01em] text-text sm:text-[32px]">
          Client-ready before / during / after reports
        </h1>
      </header>

      {/* Step indicator */}
      <nav aria-label="Steps" className="mb-8 flex items-center gap-1 border-b border-hairline pb-4">
        {STEPS.map((label, i) => {
          const n = (i + 1) as WizardState["step"];
          const active = state.step === n;
          const done = state.step > n;
          return (
            <button
              key={label}
              type="button"
              onClick={() => (done || active ? go(n) : undefined)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] transition-colors ${
                active
                  ? "bg-accent font-medium text-accent-contrast"
                  : done
                    ? "text-text hover:bg-bg-hover"
                    : "cursor-default text-text-tertiary"
              }`}
            >
              <span className="font-mono text-[11px]">{n}</span>
              {label}
            </button>
          );
        })}
      </nav>

      {state.step === 1 && (
        <StepDetails state={state} set={set} onNext={() => go(2)} canNext={canLeaveStep1} />
      )}
      {state.step === 2 && (
        <div className="step-enter">
          <StepHeading
            title="Choose a template"
            sub="The template drives the whole document — cover, section dividers and page chrome. Previews update live with your details."
          />
          <TemplatePicker state={state} onSelect={(id) => set("templateId", id)} />
          <StepFooter onBack={() => go(1)} onNext={() => go(3)} />
        </div>
      )}
      {state.step === 3 && (
        <div className="step-enter">
          <StepHeading
            title="Add photo evidence"
            sub="Before and after tell the story; during is optional and simply skipped if empty. Drag photos to reorder — order is kept in the report."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {PHASES.map((phase) => (
              <UploadZone
                key={phase}
                phase={phase}
                images={state.photos[phase]}
                onChange={(images) => set("photos", { ...state.photos, [phase]: images })}
              />
            ))}
          </div>
          <StepFooter
            onBack={() => go(2)}
            onNext={() => go(4)}
            nextDisabled={totalPhotos === 0}
            nextHint={totalPhotos === 0 ? "Add at least one photo" : undefined}
          />
        </div>
      )}
      {state.step === 4 && (
        <StepGenerate state={state} set={set} onBack={() => go(3)} canGenerate={canGenerate} />
      )}
    </main>
  );
}

/* ----------------------------- shared pieces ----------------------------- */

function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-[20px] font-semibold text-text">{title}</h2>
      <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-text-muted">{sub}</p>
    </div>
  );
}

function StepFooter({
  onBack,
  onNext,
  nextDisabled,
  nextHint,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextHint?: string;
}) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-hairline pt-5">
      <GhostButton onClick={onBack}>Back</GhostButton>
      <div className="flex items-center gap-3">
        {nextHint && <span className="text-[13px] text-text-muted">{nextHint}</span>}
        <PrimaryButton onClick={onNext} disabled={nextDisabled}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ------------------------------- step 1 ---------------------------------- */

function SingleUpload({
  label,
  optionalNote,
  kind,
  value,
  onChange,
  accept,
}: {
  label: string;
  optionalNote: string;
  kind: "building" | "logo";
  value: UploadedImage | null;
  onChange: (v: UploadedImage | null) => void;
  accept: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Field label={label} optional>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex h-[72px] w-28 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-border bg-bg-subtle text-[12px] text-text-muted transition-colors hover:bg-bg-hover"
        >
          {busy ? (
            <Spinner />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.url} alt="" className="size-full object-cover" />
          ) : (
            "Upload"
          )}
        </button>
        <div className="min-w-0 text-[13px] text-text-muted">
          {value ? (
            <>
              <p className="truncate text-text">{value.name}</p>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="mt-1 text-[12.5px] underline decoration-hairline underline-offset-2 hover:text-text"
              >
                Remove
              </button>
            </>
          ) : (
            <p>{optionalNote}</p>
          )}
        </div>
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            const [img] = await uploadFiles([file], kind);
            onChange(img);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed.");
          } finally {
            setBusy(false);
          }
        }}
      />
      <ErrorNote message={error} />
    </Field>
  );
}

function StepDetails({
  state,
  set,
  onNext,
  canNext,
}: {
  state: WizardState;
  set: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  onNext: () => void;
  canNext: boolean;
}) {
  return (
    <div className="step-enter">
      <StepHeading
        title="Report details"
        sub="These appear on the cover and in the running header and footer of every page."
      />
      <form
        className="max-w-2xl rounded-[16px] border border-hairline bg-bg-subtle p-5 sm:p-7"
        onSubmit={(e) => {
          e.preventDefault();
          if (canNext) onNext();
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Report title">
              <input
                className={inputCls}
                value={state.title}
                maxLength={160}
                placeholder="e.g. External Facade & Communal Areas Deep Clean"
                onChange={(e) => set("title", e.target.value)}
                required
              />
            </Field>
          </div>
          <Field label="Building name">
            <input
              className={inputCls}
              value={state.building}
              maxLength={160}
              placeholder="e.g. Riverside House"
              onChange={(e) => set("building", e.target.value)}
              required
            />
          </Field>
          <Field label="Report date">
            <input
              type="date"
              className={`${inputCls} font-mono text-[13.5px]`}
              value={state.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </Field>
          <SingleUpload
            label="Building photo"
            optionalNote="Used as the cover hero image."
            kind="building"
            accept="image/jpeg,image/png,image/webp"
            value={state.buildingPhoto}
            onChange={(v) => set("buildingPhoto", v)}
          />
          <SingleUpload
            label="Company logo"
            optionalNote="SVG or PNG. Appears on the cover and page headers."
            kind="logo"
            accept="image/svg+xml,image/png,image/jpeg,image/webp"
            value={state.logo}
            onChange={(v) => set("logo", v)}
          />
          <Field label="Prepared by" optional>
            <input
              className={inputCls}
              value={state.preparedBy}
              maxLength={100}
              placeholder="Name or team"
              onChange={(e) => set("preparedBy", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Scope of works" optional>
              <textarea
                className={`${inputCls} min-h-24 resize-y`}
                value={state.scope}
                maxLength={4000}
                placeholder="Short description of the works carried out — gets its own page in the report."
                onChange={(e) => set("scope", e.target.value)}
              />
            </Field>
          </div>
        </div>
        <div className="mt-7 flex items-center justify-end gap-3 border-t border-hairline pt-5">
          {!canNext && (
            <span className="text-[13px] text-text-muted">Title and building name are required</span>
          )}
          <PrimaryButton type="submit" disabled={!canNext}>
            Continue
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------- step 4 ---------------------------------- */

const GEN_STAGES = [
  "Laying out pages…",
  "Rendering print-grade PDF…",
  "Building Word document…",
  "Preparing download links…",
];

function StepGenerate({
  state,
  set,
  onBack,
  canGenerate,
}: {
  state: WizardState;
  set: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  onBack: () => void;
  canGenerate: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenResult | null>(null);
  // Only read after user interaction (links render post-generate), so no
  // hydration concern.
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setStage((s) => Math.min(s + 1, GEN_STAGES.length - 1)), 2500);
    return () => clearInterval(t);
  }, [busy]);

  const pairable =
    state.photos.before.length > 0 && state.photos.before.length === state.photos.after.length;
  const counts = PHASES.map((p) => state.photos[p].length);

  const generate = async () => {
    setStage(0);
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const toMeta = (img: UploadedImage) => ({
        id: img.id,
        width: img.width,
        height: img.height,
        caption: img.caption?.trim() || undefined,
      });
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: state.title,
          building: state.building,
          date: state.date,
          preparedBy: state.preparedBy || undefined,
          scope: state.scope || undefined,
          templateId: state.templateId,
          paired: state.paired && pairable,
          buildingPhoto: state.buildingPhoto ? toMeta(state.buildingPhoto) : null,
          logo: state.logo ? toMeta(state.logo) : null,
          photos: {
            before: state.photos.before.map(toMeta),
            during: state.photos.during.map(toMeta),
            after: state.photos.after.map(toMeta),
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generation failed.");
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  };

  const shareSubject = `${state.building} — ${state.title}, ${state.date}`;
  const pdfAbsolute = result ? `${origin}${result.pdfUrl}` : "";
  const shareBody = result
    ? `Hi,\n\nPlease find the cleaning works report for ${state.building}.\n\nDownload (link valid 24h): ${pdfAbsolute}\n\nBest regards${state.preparedBy ? `,\n${state.preparedBy}` : ""}`
    : "";

  return (
    <div className="step-enter">
      <StepHeading
        title="Generate & share"
        sub="A print-grade A4 PDF and a matching Word document, ready to send."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[16px] border border-hairline bg-bg-subtle p-5 sm:p-7">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px] sm:grid-cols-3">
            <div>
              <dt className="text-text-muted">Building</dt>
              <dd className="mt-0.5 font-medium text-text">{state.building || "—"}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Date</dt>
              <dd className="mt-0.5 font-mono text-[13px] text-text">{state.date}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Photos (B · D · A)</dt>
              <dd className="mt-0.5 font-mono text-[13px] text-text">
                {counts[0]} · {counts[1]} · {counts[2]}
              </dd>
            </div>
          </dl>

          <label
            className={`mt-6 flex items-start gap-3 rounded-[10px] border border-hairline bg-bg p-4 ${
              pairable ? "cursor-pointer" : "opacity-55"
            }`}
          >
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-current"
              disabled={!pairable}
              checked={state.paired && pairable}
              onChange={(e) => set("paired", e.target.checked)}
            />
            <span>
              <span className="block text-[14px] font-medium text-text">
                Paired before / after comparison
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-relaxed text-text-muted">
                {pairable
                  ? "Lay matching photos out side by side — before left, after right. During photos keep their own section."
                  : `Needs matching before/after counts (currently ${counts[0]} / ${counts[2]}).`}
              </span>
            </span>
          </label>

          <div className="mt-6">
            <PrimaryButton onClick={generate} disabled={busy || !canGenerate} full>
              {busy ? (
                <>
                  <Spinner /> {GEN_STAGES[stage]}
                </>
              ) : (
                "Generate report"
              )}
            </PrimaryButton>
            <ErrorNote message={error} />
          </div>
        </div>

        {/* Results */}
        <div className="rounded-[16px] border border-hairline bg-bg-subtle p-5 sm:p-6">
          {result ? (
            <div className="step-enter flex flex-col gap-3">
              <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-text-muted">
                REPORT READY
              </p>
              <a
                href={result.pdfUrl}
                className="flex items-center justify-between rounded-[10px] bg-accent px-4 py-3 text-[14.5px] font-medium text-accent-contrast transition-opacity hover:opacity-90"
              >
                Download PDF <span aria-hidden>↓</span>
              </a>
              <a
                href={result.docxUrl}
                className="flex items-center justify-between rounded-[10px] border border-border bg-bg px-4 py-3 text-[14.5px] font-medium text-text transition-colors hover:bg-bg-hover"
              >
                Download Word (.docx) <span aria-hidden>↓</span>
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareBody)}`}
                title="Opens your email app with a pre-filled message. Attach the downloaded file manually — email links can't carry attachments."
                className="flex items-center justify-between rounded-[10px] border border-border bg-bg px-4 py-3 text-[14.5px] font-medium text-text transition-colors hover:bg-bg-hover"
              >
                Share via Email <span aria-hidden>→</span>
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareSubject}\n\n${shareBody}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-[10px] border border-border bg-bg px-4 py-3 text-[14.5px] font-medium text-text transition-colors hover:bg-bg-hover"
              >
                Share via WhatsApp <span aria-hidden>→</span>
              </a>
              <p className="mt-1 text-[12px] leading-relaxed text-text-muted">
                Share links include a download URL that expires{" "}
                {new Date(result.expiresAt).toLocaleString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "short",
                })}
                . Email attachments must be added manually.
              </p>
            </div>
          ) : (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center">
              <p className="text-[14px] font-medium text-text-muted">No report yet</p>
              <p className="max-w-56 text-[12.5px] leading-relaxed text-text-tertiary">
                Generate to get download links and sharing options.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-hairline pt-5">
        <GhostButton onClick={onBack}>Back</GhostButton>
      </div>
    </div>
  );
}
