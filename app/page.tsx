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
import { TemplatePreview } from "@/components/wizard/TemplateGallery";
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
  const [brandOpen, setBrandOpen] = useState(false);
  const [buildings, setBuildings] = useState<BuildingView[]>([]);

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

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profiles")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (Array.isArray(json.profiles)) setProfiles(json.profiles);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const profile = profiles.find((p) => p.id === profileId) ?? profiles[0] ?? null;
  // The selected building's default photo — the report hero unless overridden.
  const buildingHero = buildings.find((b) => b.name === state.building)?.photo ?? null;

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
          buildings={buildings}
          onBuildings={setBuildings}
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
            title="Preview your report"
            sub="Flip through the pages with the arrows — this is exactly how it prints. Need a different look? Open the template picker below."
          />
          <TemplatePreview
            state={state}
            profile={profile}
            hero={buildingHero}
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
                  {fallback.name === "Building default photo" ? "BUILDING PHOTO" : "FROM BRAND PROFILE"}
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

export interface BuildingView {
  name: string;
  /** the building's default hero photo, shown on covers automatically */
  photo: { id: string; url: string; width: number; height: number } | null;
}

/** Building dropdown backed by the shared server-side list. + adds a
 *  building (with its default hero photo), − deletes the selected one. */
function BuildingSelect({
  value,
  onChange,
  buildings,
  onList,
}: {
  value: string;
  onChange: (v: string) => void;
  buildings: BuildingView[];
  onList: (list: BuildingView[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const mutate = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/buildings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (res.ok && Array.isArray(json.buildings)) onList(json.buildings);
    return res.ok;
  };

  const save = async () => {
    const name = newName.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      let photoMeta: Record<string, unknown> = {};
      if (photoFile) {
        const [img] = await uploadFiles([photoFile], "building");
        photoMeta = { photoId: img.id, photoWidth: img.width, photoHeight: img.height };
      }
      if (await mutate({ add: name, ...photoMeta })) {
        onChange(name);
        setAdding(false);
        setNewName("");
        setPhotoFile(null);
      }
    } catch {
      /* keep the form open so the user can retry */
    } finally {
      setBusy(false);
    }
  };

  const names = buildings.map((b) => b.name);
  // Keep a previously-typed / deleted value selectable so drafts stay valid.
  const options = value && !names.includes(value) ? [value, ...names] : names;

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
            setPhotoFile(null);
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
            if (await mutate({ remove: value })) onChange("");
          }}
          className="flex size-12 shrink-0 items-center justify-center rounded-[12px] border border-border bg-bg-subtle text-[20px] leading-none text-text transition-colors hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
      </div>
      {adding && (
        <div className="step-enter mt-2 flex flex-col gap-3 rounded-[14px] border border-hairline bg-bg p-3.5">
          <p className="text-[13px] font-semibold text-text">New building</p>
          <input
            className={`${inputCls} min-w-0`}
            value={newName}
            maxLength={160}
            placeholder="Building name"
            autoFocus
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (photoFile) void save();
                else photoRef.current?.click();
              }
            }}
          />
          {/* The building photo is part of adding a building — it becomes the
              report hero every time this building is selected. */}
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-[12px] border border-dashed border-border bg-bg-subtle text-[14px] text-text-muted transition-colors hover:bg-bg-hover"
          >
            {photoFile ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(photoFile)} alt="" className="size-full object-cover" />
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1.5 text-[12px] font-medium text-white">
                  ⟳ Change
                </span>
              </>
            ) : (
              <span className="flex flex-col items-center gap-0.5 px-4 text-center">
                <span className="font-medium text-text">Add the building photo</span>
                <span className="text-[12px]">
                  Shown on every report for this building — required
                </span>
              </span>
            )}
          </button>
          <input
            ref={photoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex items-center justify-end gap-3">
            {(!newName.trim() || !photoFile) && (
              <span className="text-[12.5px] text-text-muted">
                {!newName.trim() ? "Name required" : "Photo required"}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewName("");
                setPhotoFile(null);
              }}
              className="min-h-11 rounded-[12px] px-3 text-[14px] font-medium text-text-muted hover:bg-bg-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!newName.trim() || !photoFile || busy}
              onClick={save}
              className="min-h-11 shrink-0 rounded-[12px] bg-accent px-4 text-[14px] font-semibold text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {busy ? "Saving…" : "Save building"}
            </button>
          </div>
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
  buildings,
  onBuildings,
}: {
  state: WizardState;
  set: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  onNext: () => void;
  canNext: boolean;
  profile: CompanyProfileView | null;
  buildings: BuildingView[];
  onBuildings: (list: BuildingView[]) => void;
}) {
  // Hero fallback: the selected building's own photo wins over the brand's.
  const buildingPhoto = buildings.find((b) => b.name === state.building)?.photo ?? null;
  const heroFallback: UploadedImage | null = buildingPhoto
    ? { ...buildingPhoto, name: "Building default photo" }
    : profile?.building
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
            <BuildingSelect
              value={state.building}
              onChange={(v) => set("building", v)}
              buildings={buildings}
              onList={onBuildings}
            />
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
                fallback={heroFallback}
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
      // The result card renders where the form was — bring it into view.
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const first = results[0];
  const shareSubject = `${state.building} — ${state.title}, ${state.date}`;
  const pdfAbsolute = first ? `${origin}${first.pdfUrl}` : "";
  const shareBody = first
    ? `Hi,\n\nPlease find the cleaning works report Nº ${first.reportNo} for ${state.building}.\n\nDownload: ${pdfAbsolute}\n\nBest regards${state.preparedBy ? `,\n${state.preparedBy}` : ""}`
    : "";

  const bigBtn =
    "flex min-h-14 w-full items-center justify-center gap-2 rounded-[14px] text-[16.5px] font-semibold transition-opacity hover:opacity-90";

  return (
    <div className="step-enter">
      <div className="mx-auto max-w-xl">
        {busy ? (
          /* Progress takes over the whole card while the PDF renders. */
          <div className="step-enter flex flex-col items-center gap-4 rounded-[16px] border border-hairline bg-bg-subtle px-6 py-12 text-center">
            <span
              aria-hidden
              className="inline-block size-11 animate-spin rounded-full border-[3.5px] border-accent border-t-transparent"
            />
            <p className="text-[17px] font-bold text-text">Generating your report…</p>
            <p className="text-[13px] text-text-muted">
              {progress || "Laying out pages and photos"}
            </p>
            <div className="h-1.5 w-full max-w-60 overflow-hidden rounded-full bg-bg-element">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-[16px] border border-hairline bg-bg-subtle p-4 sm:p-6">
            <p className="text-[15px] text-text">
              <span className="font-bold">{state.title || "Report"}</span>
              <span className="text-text-muted">
                {" "}
                — {state.building || "—"} · {state.date}
              </span>
            </p>
            <div className="mt-4">
              <Field label="Remarks" optional>
                <textarea
                  className={`${inputCls} min-h-20 resize-y`}
                  value={state.remarks}
                  maxLength={4000}
                  placeholder="Optional — shown on the last page of the report."
                  onChange={(e) => set("remarks", e.target.value)}
                />
              </Field>
            </div>
            <div className="mt-5">
              <PrimaryButton onClick={generate} disabled={!canGenerate} full>
                Generate report
              </PrimaryButton>
              <ErrorNote message={error} />
            </div>
          </div>
        ) : (
          <div className="step-enter rounded-[16px] border border-hairline bg-bg-subtle p-4 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1E9E57] text-[16px] text-white">
                ✓
              </span>
              <div className="min-w-0">
                <p className="text-[17px] font-bold text-text">Report ready</p>
                <p className="truncate text-[13px] text-text-muted">
                  Nº {first.reportNo} · {state.building}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {results.map((r) => (
                <a
                  key={r.templateId}
                  href={r.pdfUrl}
                  className={`${bigBtn} bg-accent text-accent-contrast shadow-[0_10px_24px_rgba(0,122,255,0.25)]`}
                >
                  ⬇ Download PDF
                  {results.length > 1 ? ` — ${r.templateName.replace("Focused — ", "")}` : ""}
                </a>
              ))}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareSubject}\n\n${shareBody}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${bigBtn} bg-[#25D366] text-white`}
              >
                Share via WhatsApp
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareBody)}`}
                className={`${bigBtn} border border-border bg-bg text-text hover:bg-bg-hover`}
              >
                Share via Email
              </a>
            </div>

            <div className="mt-5 flex items-center justify-center gap-5 text-[13px] text-text-muted">
              <a
                href={first.docxUrl}
                className="underline decoration-hairline underline-offset-2 hover:text-text"
              >
                Word version
              </a>
              <Link
                href="/reports"
                className="underline decoration-hairline underline-offset-2 hover:text-text"
              >
                All reports
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <GhostButton onClick={onBack}>Back</GhostButton>
      </div>
    </div>
  );
}
