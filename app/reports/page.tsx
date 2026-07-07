"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { inputCls } from "@/components/wizard/ui";

interface ReportRow {
  reportNo: string;
  createdBy?: string;
  title: string;
  building: string;
  date: string;
  preparedBy?: string;
  createdAt: string;
  pdfUrl: string;
  docxUrl: string;
}

export default function ReportsPage() {
  const [q, setQ] = useState("");
  const [mine, setMine] = useState(true);
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/reports?q=${encodeURIComponent(q)}&mine=${mine ? "1" : "0"}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load reports.");
        setRows(json.reports);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load reports.");
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q, mine]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-text-muted">
            REPORT ARCHIVE
          </p>
          <h1 className="mt-2 font-display text-[26px] font-semibold tracking-[-0.01em] text-text">
            Stored reports
          </h1>
        </div>
        <Link
          href="/"
          className="rounded-[10px] border border-border bg-bg px-4 py-2 text-[14px] font-medium text-text transition-colors hover:bg-bg-hover"
        >
          New report
        </Link>
      </header>

      <div className="mb-4 flex w-fit items-center gap-1 rounded-[12px] border border-border bg-bg p-1">
        {(
          [
            [true, "My reports"],
            [false, "All reports"],
          ] as [boolean, string][]
        ).map(([value, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setMine(value)}
            aria-pressed={mine === value}
            className={`min-h-10 rounded-[9px] px-4 text-[14px] font-medium transition-colors ${
              mine === value ? "bg-accent text-accent-contrast" : "text-text-muted hover:bg-bg-hover"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <input
        className={inputCls}
        placeholder="Search by report number, building or title…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      {error && <p className="mt-3 text-[13px] font-medium text-text">⚠ {error}</p>}

      <ul className="mt-6 flex flex-col gap-3">
        {rows === null && !error && (
          <li className="rounded-[12px] border border-hairline bg-bg-subtle p-6 text-center text-[14px] text-text-muted">
            Loading…
          </li>
        )}
        {rows?.length === 0 && (
          <li className="rounded-[12px] border border-hairline bg-bg-subtle p-8 text-center">
            <p className="text-[14px] font-medium text-text-muted">
              {q
                ? "No reports match your search."
                : mine
                  ? "You haven't generated any reports yet."
                  : "No reports stored yet."}
            </p>
            <p className="mt-1 text-[12.5px] text-text-tertiary">
              Generated reports appear here with their report number.
            </p>
          </li>
        )}
        {rows?.map((r) => (
          <li
            key={r.reportNo}
            className="flex flex-col gap-3 rounded-[12px] border border-hairline bg-bg-subtle p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-mono text-[11.5px] font-medium tracking-[0.08em] text-text-muted">
                Nº {r.reportNo} · {r.date}
              </p>
              <p className="mt-1 truncate text-[15px] font-medium text-text">{r.title}</p>
              <p className="mt-0.5 truncate text-[13px] text-text-muted">
                {r.building}
                {r.preparedBy ? ` · ${r.preparedBy}` : ""}
                {r.createdBy ? ` · by ${r.createdBy}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <a
                href={r.pdfUrl}
                className="rounded-[8px] bg-accent px-3.5 py-2 text-[13px] font-medium text-accent-contrast transition-opacity hover:opacity-90"
              >
                PDF
              </a>
              <a
                href={r.docxUrl}
                className="rounded-[8px] border border-border bg-bg px-3.5 py-2 text-[13px] font-medium text-text transition-colors hover:bg-bg-hover"
              >
                Word
              </a>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
