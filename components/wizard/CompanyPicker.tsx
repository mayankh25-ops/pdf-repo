"use client";

import { useRef, useState } from "react";
import { ErrorNote, Field, PrimaryButton, Spinner, inputCls } from "./ui";

export interface CompanyProfileView {
  id: string;
  name: string;
  accent: string;
  logo: { id: string; url: string; width: number; height: number };
}

/**
 * Company profile selector: the active profile supplies the logo, brand name
 * and document accent for every generated report. "+" adds a new profile
 * (brand name, logo, accent).
 */
export function CompanyPicker({
  profiles,
  selectedId,
  onSelect,
  onCreated,
}: {
  profiles: CompanyProfileView[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreated: (profile: CompanyProfileView) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [accent, setAccent] = useState("#D9232E");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const create = async () => {
    if (!name.trim() || !logoFile) {
      setError("A brand name and a logo are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("name", name.trim());
      form.set("accent", accent);
      form.set("logo", logoFile);
      const res = await fetch("/api/profiles", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not create the profile.");
      onCreated(json.profile);
      setAdding(false);
      setName("");
      setLogoFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-2 font-mono text-[11px] font-medium tracking-[0.12em] text-text-muted">
        COMPANY PROFILE
      </p>
      <div className="flex flex-wrap items-stretch gap-2.5">
        {profiles.map((p) => {
          const active = p.id === selectedId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              aria-pressed={active}
              className={`flex min-h-12 items-center gap-3 rounded-[12px] border px-3.5 py-2 transition-colors ${
                active
                  ? "border-border-strong bg-bg-subtle ring-2 ring-accent"
                  : "border-border bg-bg hover:bg-bg-hover"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.logo.url} alt="" className="h-7 w-auto max-w-16 object-contain" />
              <span className="text-left">
                <span className="block text-[14px] font-medium leading-tight text-text">{p.name}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-muted">
                  <span className="inline-block size-2.5 rounded-full" style={{ background: p.accent }} />
                  Brand accent
                </span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          aria-expanded={adding}
          className="flex min-h-12 items-center gap-2 rounded-[12px] border border-dashed border-border px-4 text-[14px] font-medium text-text-muted transition-colors hover:bg-bg-hover hover:text-text"
        >
          <span aria-hidden className="text-[18px] leading-none">＋</span> Add company
        </button>
      </div>

      {adding && (
        <div className="step-enter mt-3 max-w-xl rounded-[16px] border border-hairline bg-bg-subtle p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand name">
              <input
                className={inputCls}
                value={name}
                maxLength={120}
                placeholder="e.g. Focused Facilities Management"
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Brand accent">
              <div className="flex min-h-12 items-center gap-3 rounded-[10px] border border-border bg-bg px-3">
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="size-8 cursor-pointer rounded border-none bg-transparent p-0"
                  aria-label="Brand accent colour"
                />
                <span className="font-mono text-[13px] text-text-muted">{accent.toUpperCase()}</span>
              </div>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Logo (SVG or PNG)">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex min-h-12 w-full items-center justify-between rounded-[10px] border border-dashed border-border bg-bg px-4 text-[15px] text-text-muted transition-colors hover:bg-bg-hover"
                >
                  <span className="truncate">{logoFile ? logoFile.name : "Tap to choose a logo file"}</span>
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
          </div>
          <ErrorNote message={error} />
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="min-h-12 rounded-[12px] px-4 text-[15px] font-medium text-text-muted hover:bg-bg-hover"
            >
              Cancel
            </button>
            <PrimaryButton onClick={create} disabled={busy}>
              {busy ? <Spinner /> : null} Save profile
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
