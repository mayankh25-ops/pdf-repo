"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Phase, TemplateId } from "@/lib/types";
import { PHASES } from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";
import type { UploadedImage, WizardState } from "@/components/wizard/types";
import { initialState, uploadFiles } from "@/components/wizard/types";
import { Field, GhostButton, PrimaryButton, Spinner, ErrorNote, inputCls } from "@/components/wizard/ui";
import type { MovePayload } from "@/components/wizard/UploadZone";
import { UploadZone } from "@/components/wizard/UploadZone";
import { TemplateGallery } from "@/components/wizard/TemplateGallery";
import type { CompanyProfileView } from "@/components/wizard/CompanyPicker";
import { CompanyPicker } from "@/components/wizard/CompanyPicker";
import { usePersistent } from "@/components/wizard/usePersistent";

const STEPS = ["Details", "Photos", "Templates", "Generate"] as const;

interface GenResult {
  reportNo: string;
  pdfUrl: string;
  docxUrl: string;
}

interface TemplateResult extends GenResult {
  templateId: TemplateId;
  templateName: string;
}

/** Shared request body for /api/generate — one call per template. */
function buildPayload(state: WizardState, profileId: string, templateId: TemplateId) {
  const toMeta = (img: UploadedImage) => ({
    id: img.id,
    width: img.width,
    height: img.height,
    caption: img.caption?.trim() || undefined,
  });
  const pairable =
    state.photos.before.length > 0 && state.photos.before.length === state.photos.after.length;
  return {
    title: state.title,
    building: state.building,
    date: state.date,
    level: state.level || undefined,
    area: state.area || undefined,
    preparedBy: state.preparedBy || undefined,
    scope: state.scope || undefined,
    remarks: state.remarks || undefined,
    profileId,
    templateId,
    paired: state.paired && pairable,
    buildingPhoto: state.buildingPhoto ? toMeta(state.buildingPhoto) : null,
    photos: {
      before: state.photos.before.map(toMeta),
      during: state.photos.during.map(toMeta),
      after: state.photos.after.map(toMeta),
      general: state.photos.general.map(toMeta),
    },
  };
}

type PhotoLayout = "auto" | "columns" | "rows";

export default function Home() {
  const [state, setState] = useState<WizardState>(initialState);
  const [layoutRaw, setLayoutRaw] = usePersistent("cwr-photo-layout", "auto");
  const [profileId, setProfileId] = usePersistent("cwr-profile", "focused-fm");
  const [profiles, setProfiles] = useState<CompanyProfileView[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profiles")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && Array.isArray(json.profiles)) setProfiles(json.profiles);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const profile = profiles.find((p) => p.id === profileId) ?? profiles[0] ?? null;

  const toggleTemplate = (id: TemplateId) =>
    setState((s) => ({
      ...s,
      templateIds: s.templateIds.includes(id)
        ? s.templateIds.filter((t) => t !== id)
        : [...s.templateIds, id],
    }));

  const photoLayout: PhotoLayout =
    layoutRaw === "columns" || layoutRaw === "rows" ? layoutRaw : "auto";
  const setPhotoLayout = (v: PhotoLayout) => setLayoutRaw(v);
  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const totalPhotos = PHASES.reduce((n, p) => n + state.photos[p].length, 0);
  const canLeaveStep1 = state.title.trim().length > 0 && state.building.trim().length > 0;
  const canGenerate = canLeaveStep1 && totalPhotos > 0 && state.templateIds.length > 0;

  const go = (step: WizardState["step"]) => {
    setState((s) => ({ ...s, step }));
    window.scrollTo({ top: 0 });
  };

  /** Moves a photo within or between phase zones (drag-and-drop / selector). */
  const movePhoto = (payload: MovePayload, toPhase: Phase, toIndex: number | null) => {
    setState((s) => {
      const img = s.photos[payload.fromPhase].find((x) => x.id === payload.id);
      if (!img) return s;
      const source = s.photos[payload.fromPhase].filter((x) => x.id !== payload.id);
      const target = payload.fromPhase === toPhase ? source : [...s.photos[toPhase]];
      const idx = toIndex === null ? target.length : Math.min(toIndex, target.length);
      target.splice(idx, 0, img);
      return {
        ...s,
        photos: { ...s.photos, [payload.fromPhase]: source, [toPhase]: target },
      };
    });
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-bg text-text">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.logo.url}
              alt={profile.name}
              className="h-12 w-auto max-w-32 shrink-0 object-contain sm:h-14"
            />
          )}
          <div>
            <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-text-muted">
              CLEANING WORKS REPORT GENERATOR
            </p>
            <h1 className="mt-2 font-display text-[24px] font-semibold tracking-[-0.01em] text-text sm:text-[30px]">
              Client-ready before / during / after reports
            </h1>
          </div>
        </div>
        <Link
          href="/reports"
          className="shrink-0 rounded-[10px] border border-border bg-bg px-4 py-2 text-[14px] font-medium text-text transition-colors hover:bg-bg-hover"
        >
          Reports
        </Link>
      </header>

      <div className="mb-6">
        <CompanyPicker
          profiles={profiles}
          selectedId={profile?.id ?? "focused-fm"}
          onSelect={setProfileId}
          onSaved={(saved) => {
            setProfiles((list) =>
              list.some((p) => p.id === saved.id)
                ? list.map((p) => (p.id === saved.id ? saved : p))
                : [...list, saved],
            );
            setProfileId(saved.id);
          }}
        />
      </div>

      {/* Step indicator */}
      <nav aria-label="Steps" className="mb-8 flex items-center gap-1 overflow-x-auto border-b border-hairline pb-4">
        {STEPS.map((label, i) => {
          const n = (i + 1) as WizardState["step"];
          const active = state.step === n;
          const done = state.step > n;
          return (
            <button
              key={label}
              type="button"
              onClick={() => (done || active ? go(n) : undefined)}
              className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[14px] transition-colors ${
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
            title="Add photo evidence"
            sub="Before and after tell the story; during is optional and simply skipped if empty. Drag photos to reorder, or drag them between sections if one landed in the wrong place."
          />
          <div className="mb-4 flex w-fit items-center gap-1 rounded-[12px] border border-border bg-bg p-1">
            {(
              [
                ["auto", "Auto"],
                ["columns", "Columns"],
                ["rows", "Rows"],
              ] as [PhotoLayout, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPhotoLayout(value)}
                aria-pressed={photoLayout === value}
                className={`min-h-10 rounded-[9px] px-4 text-[14px] font-medium transition-colors ${
                  photoLayout === value
                    ? "bg-accent text-accent-contrast"
                    : "text-text-muted hover:bg-bg-hover"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className={
              photoLayout === "rows"
                ? "flex flex-col gap-4"
                : photoLayout === "columns"
                  ? "grid grid-cols-2 gap-3 lg:grid-cols-4"
                  : "flex flex-col gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-4"
            }
          >
            {PHASES.map((phase) => (
              <UploadZone
                key={phase}
                phase={phase}
                images={state.photos[phase]}
                onChange={(images) => set("photos", { ...state.photos, [phase]: images })}
                onAppend={(imgs) =>
                  setState((s) => ({
                    ...s,
                    photos: { ...s.photos, [phase]: [...s.photos[phase], ...imgs] },
                  }))
                }
                onMove={movePhoto}
                narrow={photoLayout !== "rows"}
              />
            ))}
          </div>
          <StepFooter
            onBack={() => go(1)}
            onNext={() => go(3)}
            nextDisabled={totalPhotos === 0}
            nextHint={totalPhotos === 0 ? "Add at least one photo" : undefined}
          />
        </div>
      )}
      {state.step === 3 && (
        <div className="step-enter">
          <StepHeading
            title="Pick templates"
            sub="First-page previews with your real photos and details. Tap to select — you can pick several and download each on the next step."
          />
          <TemplateGallery
            state={state}
            profile={profile}
            selected={state.templateIds}
            onToggle={toggleTemplate}
          />
          <StepFooter
            onBack={() => go(2)}
            onNext={() => go(4)}
            nextDisabled={state.templateIds.length === 0}
            nextHint={
              state.templateIds.length === 0
                ? "Select at least one template"
                : `${state.templateIds.length} selected`
            }
          />
        </div>
      )}
      {state.step === 4 && (
        <StepGenerate
          state={state}
          set={set}
          onBack={() => go(3)}
          canGenerate={canGenerate}
          profile={profile}
        />
      )}
      </main>
    </div>
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
    <div
      className="sticky bottom-0 z-20 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-hairline bg-bg/90 px-4 pt-4 backdrop-blur-md sm:static sm:z-auto sm:mx-0 sm:bg-transparent sm:px-0 sm:pt-5 sm:backdrop-blur-none"
      style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
    >
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
  hero = false,
}: {
  label: string;
  optionalNote: string;
  kind: "building" | "logo";
  value: UploadedImage | null;
  onChange: (v: UploadedImage | null) => void;
  accept: string;
  /** large full-width preview (building/homepage picture) */
  hero?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Field label={label} optional>
      <div className={hero ? "flex flex-col gap-2" : "flex items-center gap-3"}>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className={
            hero
              ? "relative flex h-44 w-full items-center justify-center overflow-hidden rounded-[12px] border border-dashed border-border bg-bg-subtle text-[14px] text-text-muted transition-colors hover:bg-bg-hover sm:h-52"
              : "flex h-[72px] w-28 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-border bg-bg-subtle text-[12px] text-text-muted transition-colors hover:bg-bg-hover"
          }
        >
          {busy ? (
            <Spinner />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.url} alt="" className="size-full object-cover" />
          ) : hero ? (
            <span className="flex flex-col items-center gap-1">
              <span className="font-medium text-text">Tap to add the building photo</span>
              <span className="text-[12.5px]">{optionalNote}</span>
            </span>
          ) : (
            "Upload"
          )}
        </button>
        <div className="min-w-0 text-[13px] text-text-muted">
          {value ? (
            <>
              {!hero && <p className="truncate text-text">{value.name}</p>}
              <button
                type="button"
                onClick={() => onChange(null)}
                className="mt-1 text-[12.5px] underline decoration-hairline underline-offset-2 hover:text-text"
              >
                Remove
              </button>
            </>
          ) : hero ? null : (
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
              className={`${inputCls} font-mono`}
              value={state.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </Field>
          <Field label="Level / floor" optional>
            <input
              className={inputCls}
              value={state.level}
              maxLength={40}
              placeholder="e.g. B1"
              onChange={(e) => set("level", e.target.value)}
            />
          </Field>
          <Field label="Area" optional>
            <input
              className={inputCls}
              value={state.area}
              maxLength={80}
              placeholder="e.g. Corridor"
              onChange={(e) => set("area", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <SingleUpload
              label="Building photo"
              optionalNote="Used as the cover hero image on the report."
              kind="building"
              accept="image/jpeg,image/png,image/webp"
              value={state.buildingPhoto}
              onChange={(v) => set("buildingPhoto", v)}
              hero
            />
          </div>
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

function StepGenerate({
  state,
  set,
  onBack,
  canGenerate,
  profile,
}: {
  state: WizardState;
  set: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  onBack: () => void;
  canGenerate: boolean;
  profile: CompanyProfileView | null;
}) {
  const profileId = profile?.id ?? "focused-fm";
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TemplateResult[]>([]);
  // Only read after user interaction (links render post-generate), so no
  // hydration concern.
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const pairable =
    state.photos.before.length > 0 && state.photos.before.length === state.photos.after.length;
  const counts = PHASES.map((p) => state.photos[p].length);

  /** Generates every selected template sequentially. */
  const generate = async () => {
    setBusy(true);
    setError(null);
    setResults([]);
    const done: TemplateResult[] = [];
    try {
      for (let i = 0; i < state.templateIds.length; i++) {
        const templateId = state.templateIds[i];
        const name = TEMPLATES.find((t) => t.id === templateId)?.name ?? templateId;
        setProgress(`Generating ${name} (${i + 1}/${state.templateIds.length})…`);
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload(state, profileId, templateId)),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Generation failed for ${name}.`);
        done.push({ ...json, templateId, templateName: name });
        setResults([...done]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const first = results[0];
  const shareSubject = `${state.building} — ${state.title}, ${state.date}`;
  const pdfAbsolute = first ? `${origin}${first.pdfUrl}` : "";
  const shareBody = first
    ? `Hi,\n\nPlease find the cleaning works report Nº ${first.reportNo} for ${state.building}.\n\nDownload: ${pdfAbsolute}\n\nBest regards${state.preparedBy ? `,\n${state.preparedBy}` : ""}`
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
              <dt className="text-text-muted">Photos (B · D · A · No tag)</dt>
              <dd className="mt-0.5 font-mono text-[13px] text-text">{counts.join(" · ")}</dd>
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

          <div className="mt-5">
            <Field label="Remarks" optional>
              <textarea
                className={`${inputCls} min-h-20 resize-y`}
                value={state.remarks}
                maxLength={4000}
                placeholder="Only appears on the last page of the report if you write something here."
                onChange={(e) => set("remarks", e.target.value)}
              />
            </Field>
          </div>

          <div className="mt-6">
            <PrimaryButton onClick={generate} disabled={busy || !canGenerate} full>
              {busy ? (
                <>
                  <Spinner /> {progress || "Generating…"}
                </>
              ) : (
                `Generate ${state.templateIds.length > 1 ? `${state.templateIds.length} reports` : "report"}`
              )}
            </PrimaryButton>
            <ErrorNote message={error} />
          </div>
        </div>

        {/* Results */}
        <div className="rounded-[16px] border border-hairline bg-bg-subtle p-5 sm:p-6">
          {results.length > 0 ? (
            <div className="step-enter flex flex-col gap-4">
              {results.map((r) => (
                <div key={r.templateId} className="rounded-[12px] border border-hairline bg-bg p-3.5">
                  <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-text-muted">
                    Nº {r.reportNo} · {r.templateName.toUpperCase()}
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    <a
                      href={r.pdfUrl}
                      className="flex flex-1 items-center justify-center rounded-[10px] bg-accent px-3 py-2.5 text-[14px] font-medium text-accent-contrast transition-opacity hover:opacity-90"
                    >
                      PDF ↓
                    </a>
                    <a
                      href={r.docxUrl}
                      className="flex flex-1 items-center justify-center rounded-[10px] border border-border bg-bg px-3 py-2.5 text-[14px] font-medium text-text transition-colors hover:bg-bg-hover"
                    >
                      Word ↓
                    </a>
                  </div>
                </div>
              ))}
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
                Stored on this portal — find every report anytime under{" "}
                <Link href="/reports" className="underline decoration-hairline underline-offset-2">
                  Reports
                </Link>
                . Share links point at the first report; email attachments must be added manually.
              </p>
            </div>
          ) : (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center">
              <p className="text-[14px] font-medium text-text-muted">
                {state.templateIds.length} template{state.templateIds.length === 1 ? "" : "s"} selected
              </p>
              <p className="max-w-56 text-[12.5px] leading-relaxed text-text-tertiary">
                Generate to get download links for each selected template.
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
