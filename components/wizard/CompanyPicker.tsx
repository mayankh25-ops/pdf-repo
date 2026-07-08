"use client";

import { useRef, useState } from "react";
import { ErrorNote, Field, PrimaryButton, Spinner, inputCls } from "./ui";

export interface CompanyProfileView {
  id: string;
  name: string;
  accent: string;
  logoScale: number;
  logo: { id: string; url: string; width: number; height: number };
  /** brand-level default building/hero photo for report covers */
  building?: { id: string; url: string; width: number; height: number } | null;
}

interface EditorState {
  id?: string;
  name: string;
  accent: string;
  logoScale: number;
  currentLogoUrl?: string;
  currentBuildingUrl?: string;
}

/**
 * Company profile selector: the active profile supplies the logo, brand name,
 * accent and logo size for every generated report. "+" adds a new profile;
 * the pencil edits an existing one (including the built-in Focused profile).
 */
export function CompanyPicker({
  profiles,
  selectedId,
  onSelect,
  onSaved,
}: {
  profiles: CompanyProfileView[];
  selectedId: string;
  onSelect: (id: string) => void;
  onSaved: (profile: CompanyProfileView) => void;
}) {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [buildingFile, setBuildingFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const buildingRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setEditor({ name: "", accent: "#D9232E", logoScale: 1 });
    setLogoFile(null);
    setBuildingFile(null);
    setError(null);
  };
  const openEdit = (p: CompanyProfileView) => {
    setEditor({
      id: p.id,
      name: p.name,
      accent: p.accent,
      logoScale: p.logoScale ?? 1,
      currentLogoUrl: p.logo.url,
      currentBuildingUrl: p.building?.url,
    });
    setLogoFile(null);
    setBuildingFile(null);
    setError(null);
  };

  const save = async () => {
    if (!editor) return;
    if (!editor.name.trim() || (!editor.id && !logoFile)) {
      setError("A brand name and a logo are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      if (editor.id) form.set("id", editor.id);
      form.set("name", editor.name.trim());
      form.set("accent", editor.accent);
      form.set("logoScale", String(editor.logoScale));
      if (logoFile) form.set("logo", logoFile);
      if (buildingFile) form.set("building", buildingFile);
      const res = await fetch("/api/profiles", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not save the profile.");
      onSaved(json.profile);
      setEditor(null);
      setLogoFile(null);
      setBuildingFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the profile.");
    } finally {
      setBusy(false);
    }
  };

  const previewLogoUrl = logoFile ? URL.createObjectURL(logoFile) : editor?.currentLogoUrl;

  return (
    <div>
      <p className="mb-2 font-mono text-[11px] font-medium tracking-[0.12em] text-text-muted">
        COMPANY PROFILE
      </p>
      <div className="flex flex-wrap items-stretch gap-2.5">
        {profiles.map((p) => {
          const active = p.id === selectedId;
          return (
            <div
              key={p.id}
              className={`flex min-h-12 max-w-full items-stretch overflow-hidden rounded-[12px] border transition-colors ${
                active
                  ? "border-border-strong bg-bg-subtle ring-2 ring-accent"
                  : "border-border bg-bg hover:bg-bg-hover"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                aria-pressed={active}
                className="flex min-w-0 items-center gap-3 px-3.5 py-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.logo.url} alt="" className="h-7 w-auto max-w-16 shrink-0 object-contain" />
                <span className="min-w-0 text-left">
                  <span className="block truncate text-[14px] font-medium leading-tight text-text">
                    {p.name}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-muted">
                    <span
                      className="inline-block size-2.5 rounded-full"
                      style={{ background: p.accent }}
                    />
                    Brand accent
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => openEdit(p)}
                aria-label={`Edit ${p.name}`}
                title="Edit brand"
                className="flex min-w-11 items-center justify-center border-l border-hairline text-[15px] text-text-muted transition-colors hover:bg-bg-hover hover:text-text"
              >
                ✎
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={openCreate}
          aria-expanded={editor !== null && !editor.id}
          className="flex min-h-12 items-center gap-2 rounded-[12px] border border-dashed border-border px-4 text-[14px] font-medium text-text-muted transition-colors hover:bg-bg-hover hover:text-text"
        >
          <span aria-hidden className="text-[18px] leading-none">＋</span> Add company
        </button>
      </div>

      {editor && (
        <div className="step-enter mt-3 max-w-xl rounded-[16px] border border-hairline bg-bg-subtle p-4 sm:p-5">
          <p className="mb-4 font-mono text-[11px] font-medium tracking-[0.12em] text-text-muted">
            {editor.id ? "EDIT BRAND" : "NEW BRAND"}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Brand name">
              <input
                className={inputCls}
                value={editor.name}
                maxLength={120}
                placeholder="e.g. Focused Facilities Management"
                onChange={(e) => setEditor({ ...editor, name: e.target.value })}
              />
            </Field>
            <Field label="Brand accent">
              <div className="flex min-h-12 flex-wrap items-center gap-3">
                {["#D9232E", "#0F7B84", "#3A4A8C", "#B0761A", "#1B1B1B"].map((c) => {
                  const active = editor.accent.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Accent ${c}`}
                      aria-pressed={active}
                      onClick={() => setEditor({ ...editor, accent: c })}
                      className="size-10 rounded-full transition-shadow"
                      style={{
                        background: c,
                        boxShadow: active ? `0 0 0 3px var(--bg-subtle), 0 0 0 5px ${c}` : undefined,
                      }}
                    />
                  );
                })}
                <label
                  className="relative flex size-10 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-dashed border-border text-[16px] text-text-muted"
                  title="Custom colour"
                >
                  +
                  <input
                    type="color"
                    value={editor.accent}
                    onChange={(e) => setEditor({ ...editor, accent: e.target.value })}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                    aria-label="Custom brand accent colour"
                  />
                </label>
                <span className="font-mono text-[13px] text-text-muted">
                  {editor.accent.toUpperCase()}
                </span>
              </div>
            </Field>
            <div className="sm:col-span-2">
              <Field label={editor.id ? "Replace logo" : "Logo (SVG or PNG)"} optional={!!editor.id}>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex min-h-12 w-full items-center justify-between gap-3 rounded-[10px] border border-dashed border-border bg-bg px-4 text-[15px] text-text-muted transition-colors hover:bg-bg-hover"
                >
                  <span className="truncate">
                    {logoFile
                      ? logoFile.name
                      : editor.id
                        ? "Keep current logo (tap to replace)"
                        : "Tap to choose a logo file"}
                  </span>
                  <span className="shrink-0 text-[13px]">Browse</span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/svg+xml,image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Building photo — default report hero" optional>
                <button
                  type="button"
                  onClick={() => buildingRef.current?.click()}
                  className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-border bg-bg text-[14px] text-text-muted transition-colors hover:bg-bg-hover sm:h-32"
                >
                  {buildingFile || editor.currentBuildingUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={buildingFile ? URL.createObjectURL(buildingFile) : editor.currentBuildingUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                      <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1.5 text-[12px] font-medium text-white">
                        ⟳ Change
                      </span>
                    </>
                  ) : (
                    <span className="flex flex-col items-center gap-0.5 px-4 text-center">
                      <span className="font-medium text-text">Tap to add a building photo</span>
                      <span className="text-[12px]">
                        Used as the cover hero on every report for this brand — reports can still
                        override it.
                      </span>
                    </span>
                  )}
                </button>
                <input
                  ref={buildingRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => setBuildingFile(e.target.files?.[0] ?? null)}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label={`Logo size in reports · ${Math.round(editor.logoScale * 100)}%`}>
                <input
                  type="range"
                  min={50}
                  max={250}
                  step={5}
                  value={Math.round(editor.logoScale * 100)}
                  onChange={(e) => setEditor({ ...editor, logoScale: Number(e.target.value) / 100 })}
                  className="h-12 w-full accent-current"
                  aria-label="Logo size in reports"
                />
              </Field>
              {/* Live preview at true document proportions: header height is 8mm ≈ 30px */}
              <div className="mt-1 flex items-center justify-between rounded-[10px] border border-hairline bg-white px-4 py-3">
                {previewLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewLogoUrl}
                    alt=""
                    style={{
                      height: `${30 * editor.logoScale}px`,
                      maxWidth: `${151 * editor.logoScale}px`,
                      width: "auto",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span className="text-[13px] text-text-muted">Logo preview</span>
                )}
                <span className="font-mono text-[10px] tracking-[0.1em] text-text-tertiary">
                  PAGE HEADER PREVIEW
                </span>
              </div>
            </div>
          </div>
          <ErrorNote message={error} />
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditor(null)}
              className="min-h-12 rounded-[12px] px-4 text-[15px] font-medium text-text-muted hover:bg-bg-hover"
            >
              Cancel
            </button>
            <PrimaryButton onClick={save} disabled={busy}>
              {busy ? <Spinner /> : null} {editor.id ? "Save changes" : "Save profile"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
