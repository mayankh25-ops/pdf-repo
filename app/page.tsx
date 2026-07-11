"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Phase, TemplateId } from "@/lib/types";
import { PHASES } from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";
import type { UploadedImage, WizardState } from "@/components/wizard/types";
import { initialState, uploadFiles } from "@/components/wizard/types";
import {
  Field,
  GhostButton,
  PrimaryButton,
  SegmentedControl,
  Spinner,
  ErrorNote,
  inputCls,
} from "@/components/wizard/ui";
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

/** Tinted phase-count pills, colours from the mobile design handoff. */
const PHASE_PILL: Record<Phase, { label: string; bg: string; fg: string }> = {
  before: { label: "BEFORE", bg: "rgba(217,35,46,0.09)", fg: "#D9232E" },
  during: { label: "DURING", bg: "rgba(232,160,32,0.12)", fg: "#B47714" },
  after: { label: "AFTER", bg: "rgba(30,158,87,0.10)", fg: "#1E9E57" },
  general: { label: "NO TAG", bg: "#F0EDE7", fg: "#8B867E" },
};

export default function Home() {
  const [state, setState] = useState<WizardState>(initialState);
  const [layoutRaw, setLayoutRaw] = usePersistent("cwr-photo-layout", "auto");
  const [profileId, setProfileId] = usePersistent("cwr-profile", "focused-fm");
  const [profiles, setProfiles] = useState<CompanyProfileView[]>([]);
  const [ephemeral, setEphemeral] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profiles")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (Array.isArray(json.profiles)) setProfiles(json.profiles);
        setEphemeral(json.ephemeralStorage === true);
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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-3 sm:px-6 sm:pt-5">
      {/* Slim single-line header: fields must start near the top of the screen. */}
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {profile && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.logo.url}
              alt={profile.name}
              className="h-8 w-auto max-w-16 shrink-0 object-contain sm:h-9"
            />
          )}
          <div className="min-w-0">
            <p className="truncate font-mono text-[9.5px] font-medium tracking-[0.12em] text-text-muted">
              CLEANING WORKS REPORTS
            </p>
            <h1 className="truncate font-display text-[16px] font-bold leading-tight tracking-[-0.01em] text-text sm:text-[18px]">
              New report
            </h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setBrandOpen((o) => !o)}
            aria-expanded={brandOpen}
            title="Company profile"
            className={`flex min-h-10 items-center gap-1.5 rounded-[12px] border px-2.5 text-[13px] font-semibold transition-colors ${
              brandOpen
                ? "border-accent bg-bg-subtle text-text ring-1 ring-accent"
                : "border-border bg-bg-subtle text-text hover:bg-bg-hover"
            }`}
          >
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ background: profile?.accent ?? "#D9232E" }}
            />
            <span className="hidden max-w-28 truncate sm:inline">{profile?.name ?? "Brand"}</span>
            <span aria-hidden className="text-[10px] text-text-muted">
              ▾
            </span>
          </button>
          <Link
            href="/reports"
            className="min-h-10 content-center rounded-[12px] border border-border bg-bg-subtle px-3 text-[13px] font-semibold text-text transition-colors hover:bg-bg-hover sm:px-4 sm:text-[14px]"
          >
            Reports
          </Link>
        </div>
      </header>

      {ephemeral && (
        <div className="mb-3 flex items-start gap-3 rounded-[14px] border border-[#EFD9A4] bg-[#FBF3E2] p-3.5">
          <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-[#E8A020]" />
          <p className="text-[13.5px] leading-relaxed text-[#7A5A12]">
            <strong>Storage is temporary.</strong> Reports, photos, brands and accounts are erased
            on every deploy or restart. In Railway, add a Volume mounted at{" "}
            <code className="font-mono">/data</code> and set the variable{" "}
            <code className="font-mono">CWR_DATA_DIR=/data</code>, then redeploy.
          </p>
        </div>
      )}

      {/* Company profile picker — collapsed behind the brand chip in the header. */}
      {brandOpen && (
        <div className="step-enter mb-4 rounded-[14px] border border-hairline bg-bg-subtle p-3.5">
          <CompanyPicker
            profiles={profiles}
            selectedId={profile?.id ?? "focused-fm"}
            onSelect={(id) => {
              setProfileId(id);
              setBrandOpen(false);
            }}
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
      )}

      {/* Step indicator — numbered circles with connector lines (design handoff) */}
      <nav aria-label="Steps" className="mb-4 flex items-center gap-2 border-b border-hairline pb-3.5">
        {STEPS.map((label, i) => {
          const n = (i + 1) as WizardState["step"];
          const active = state.step === n;
          const done = state.step > n;
          return (
            <Fragment key={label}>
              {i > 0 && (
                <div
                  aria-hidden
                  className={`h-0.5 min-w-3 flex-1 rounded-full ${state.step > i ? "bg-text" : "bg-border"}`}
                />
              )}
              <button
                type="button"
                onClick={() => (done || active ? go(n) : undefined)}
                className={`flex min-h-10 shrink-0 items-center gap-2 ${done ? "" : "cursor-default"}`}
              >
                <span
                  className={`flex size-[26px] items-center justify-center rounded-full text-[13px] font-bold ${
                    done
                      ? "bg-text text-white"
                      : active
                        ? "bg-accent text-accent-contrast"
                        : "bg-bg-element text-text-tertiary"
                  }`}
                >
                  {done ? "✓" : n}
                </span>
                <span
                  className={
                    active
                      ? "text-[13px] font-bold text-text"
                      : done
                        ? "hidden text-[13px] font-medium text-text sm:inline"
                        : "hidden text-[13px] text-text-tertiary sm:inline"
                  }
                >
                  {label}
                </span>
              </button>
            </Fragment>
          );
        })}
      </nav>

      {state.step === 1 && (
        <StepDetails
          state={state}
          set={set}
          onNext={() => go(2)}
          canNext={canLeaveStep1}
          profile={profile}
        />
      )}
      {state.step === 2 && (
        <div className="step-enter">
          <StepHeading
            title="Add photo evidence"
            sub="Before and after tell the story; during is optional and simply skipped if empty. Drag photos to reorder, or drag them between sections if one landed in the wrong place."
          />
          <div className="mb-4">
            <SegmentedControl
              options={[
                { value: "auto", label: "Auto" },
                { value: "columns", label: "Columns" },
                { value: "rows", label: "Rows" },
              ]}
              value={photoLayout}
              onChange={(v) => setPhotoLayout(v as PhotoLayout)}
            />
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
    <div className="mb-4">
      <h2 className="font-display text-[18px] font-semibold text-text sm:text-[20px]">{title}</h2>
      <p className="mt-0.5 max-w-xl text-[13px] leading-relaxed text-text-muted">{sub}</p>
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
      className="sticky bottom-0 z-20 -mx-4 mt-6 flex items-center justify-between gap-3 border-t border-hairline bg-bg/90 px-4 pt-3 backdrop-blur-md sm:-mx-6 sm:px-6"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
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
  fallback = null,
}: {
  label: string;
  optionalNote: string;
  kind: "building" | "logo";
  value: UploadedImage | null;
  onChange: (v: UploadedImage | null) => void;
  accept: string;
  /** large full-width preview (building/homepage picture) */
  hero?: boolean;
  /** brand-level default shown (and used) when no per-report photo is set */
  fallback?: UploadedImage | null;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shown = value ?? fallback;
  return (
    <Field label={label} optional>
      <div className={hero ? "flex flex-col gap-2" : "flex items-center gap-3"}>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className={
            hero
              ? "relative flex h-32 w-full items-center justify-center overflow-hidden rounded-[12px] border border-dashed border-border bg-bg-subtle text-[14px] text-text-muted transition-colors hover:bg-bg-hover sm:h-44"
              : "flex h-[72px] w-28 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-border bg-bg-subtle text-[12px] text-text-muted transition-colors hover:bg-bg-hover"
          }
        >
          {busy ? (
            <Spinner />
          ) : shown ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shown.url} alt="" className="size-full object-cover" />
              {hero && (
                <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/60 px-3 py-1.5 text-[12px] font-medium text-white">
                  ⟳ Change
                </span>
              )}
              {hero && !value && fallback && (
                <span className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-medium tracking-[0.06em] text-white">
                  FROM BRAND PROFILE
                </span>
              )}
            </>
          ) : hero ? (
            <span className="flex flex-col items-center gap-1 px-4 text-center">
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
                {fallback ? "Use brand photo instead" : "Remove"}
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

/** Building dropdown backed by the shared server-side list (+ add / − delete). */
function BuildingSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [buildings, setBuildings] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/buildings")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && Array.isArray(json.buildings)) setBuildings(json.buildings);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const mutate = async (body: { add?: string; remove?: string }) => {
    setBusy(true);
    try {
      const res = await fetch("/api/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.buildings)) setBuildings(json.buildings);
      return res.ok;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Keep a previously-typed / deleted value selectable so drafts stay valid.
  const options = value && !buildings.includes(value) ? [value, ...buildings] : buildings;

  return (
    <Field label="Building name">
      <div className="flex gap-2">
        <select
          className={`${inputCls} min-w-0 flex-1 appearance-none`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        >
          <option value="" disabled>
            Select building…
          </option>
          {options.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <button
          type="button"
          title="Add a building"
          aria-label="Add a building"
          onClick={() => {
            setAdding((a) => !a);
            setNewName("");
          }}
          className="flex size-12 shrink-0 items-center justify-center rounded-[12px] border border-border bg-bg-subtle text-[20px] leading-none text-text transition-colors hover:bg-bg-hover"
        >
          +
        </button>
        <button
          type="button"
          title="Remove selected building from the list"
          aria-label="Remove selected building from the list"
          disabled={!value || busy}
          onClick={async () => {
            const removed = value;
            if (await mutate({ remove: removed })) onChange("");
          }}
          className="flex size-12 shrink-0 items-center justify-center rounded-[12px] border border-border bg-bg-subtle text-[20px] leading-none text-text transition-colors hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
      </div>
      {adding && (
        <div className="mt-2 flex gap-2">
          <input
            className={`${inputCls} min-w-0 flex-1`}
            value={newName}
            maxLength={160}
            placeholder="New building name"
            autoFocus
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const name = newName.trim();
                if (name && (await mutate({ add: name }))) {
                  onChange(name);
                  setAdding(false);
                }
              }
            }}
          />
          <button
            type="button"
            disabled={!newName.trim() || busy}
            onClick={async () => {
              const name = newName.trim();
              if (name && (await mutate({ add: name }))) {
                onChange(name);
                setAdding(false);
              }
            }}
            className="shrink-0 rounded-[12px] bg-accent px-4 text-[14px] font-semibold text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </Field>
  );
}

function StepDetails({
  state,
  set,
  onNext,
  canNext,
  profile,
}: {
  state: WizardState;
  set: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  onNext: () => void;
  canNext: boolean;
  profile: CompanyProfileView | null;
}) {
  const brandBuilding: UploadedImage | null = profile?.building
    ? { ...profile.building, name: "Brand building photo" }
    : null;
  const moreCount = [state.level, state.area, state.preparedBy, state.scope].filter(
    (v) => v.trim() !== "",
  ).length;

  return (
    <div className="step-enter">
      <form
        className="max-w-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (canNext) onNext();
        }}
      >
        <div className="rounded-[16px] border border-hairline bg-bg-subtle p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="sm:col-span-2">
              <Field label="Report title">
                <input
                  className={inputCls}
                  value={state.title}
                  maxLength={160}
                  placeholder="e.g. External Facade & Communal Areas Deep Clean"
                  onChange={(e) => set("title", e.target.value)}
                  enterKeyHint="next"
                  autoFocus
                  required
                />
              </Field>
            </div>
            <BuildingSelect value={state.building} onChange={(v) => set("building", v)} />
            <Field label="Report date">
              <input
                type="date"
                className={`${inputCls} font-mono`}
                value={state.date}
                onChange={(e) => set("date", e.target.value)}
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
                fallback={brandBuilding}
              />
            </div>
          </div>

          {/* Optional extras stay folded so the essentials fit one screen. */}
          <details className="group mt-4 rounded-[12px] border border-hairline bg-bg" open={moreCount > 0}>
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 text-[14px] font-semibold text-text [&::-webkit-details-marker]:hidden">
              <span>
                More details{" "}
                <span className="font-normal text-text-muted">
                  — level, area, prepared by, scope
                </span>
              </span>
              <span className="flex items-center gap-2">
                {moreCount > 0 && (
                  <span className="rounded-full bg-bg-element px-2 py-0.5 text-[11px] font-bold text-text-muted">
                    {moreCount}
                  </span>
                )}
                <span aria-hidden className="text-[11px] text-text-muted transition-transform group-open:rotate-180">
                  ▾
                </span>
              </span>
            </summary>
            <div className="grid grid-cols-1 gap-4 border-t border-hairline p-4 sm:grid-cols-2">
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
                    className={`${inputCls} min-h-20 resize-y`}
                    value={state.scope}
                    maxLength={4000}
                    placeholder="Short description of the works carried out — gets its own page in the report."
                    onChange={(e) => set("scope", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </details>
        </div>

        {/* Sticky continue — always reachable without scrolling. */}
        <div
          className="sticky bottom-0 z-20 -mx-4 mt-4 flex items-center justify-end gap-3 border-t border-hairline bg-bg/90 px-4 pt-3 backdrop-blur-md"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          {!canNext && (
            <span className="text-[13px] text-text-muted">Title and building are required</span>
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
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
            <div>
              <dt className="text-text-muted">Building</dt>
              <dd className="mt-0.5 font-medium text-text">{state.building || "—"}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Date</dt>
              <dd className="mt-0.5 font-mono text-[13px] text-text">{state.date}</dd>
            </div>
          </dl>

          {/* Tinted phase-count pills (design handoff) */}
          <div className="mt-4 flex flex-wrap gap-2">
            {PHASES.map((p) => (
              <span
                key={p}
                className="flex h-7 items-center gap-1.5 rounded-full px-2.5"
                style={{ background: PHASE_PILL[p].bg }}
              >
                <span
                  className="text-[10px] font-extrabold tracking-[0.08em]"
                  style={{ color: PHASE_PILL[p].fg }}
                >
                  {PHASE_PILL[p].label}
                </span>
                <span className="text-[13px] font-bold text-text">{state.photos[p].length}</span>
              </span>
            ))}
          </div>

          <div
            className={`mt-6 flex items-start justify-between gap-3 rounded-[12px] border border-hairline bg-bg p-4 ${
              pairable ? "" : "opacity-55"
            }`}
          >
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
            <button
              type="button"
              role="switch"
              aria-checked={state.paired && pairable}
              aria-label="Paired before / after comparison"
              disabled={!pairable}
              onClick={() => set("paired", !(state.paired && pairable))}
              className={`relative mt-0.5 h-[30px] w-[50px] shrink-0 rounded-full transition-colors ${
                state.paired && pairable ? "bg-accent" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-[2px] size-[26px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-all ${
                  state.paired && pairable ? "left-[22px]" : "left-[2px]"
                }`}
              />
            </button>
          </div>

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
