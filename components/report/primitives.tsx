import type { Phase } from "@/lib/types";
import { PHASE_LABEL } from "@/lib/types";
import type { PhotoView } from "@/lib/sample";

/** Formats an ISO date for document meta lines: 05 JUL 2026 */
export const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
};

export function Logo({
  logo,
  heightMm = 7,
  reversed = false,
}: {
  logo?: PhotoView | null;
  heightMm?: number;
  reversed?: boolean;
}) {
  if (!logo) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.url}
      alt=""
      style={{
        height: `${heightMm}mm`,
        width: "auto",
        maxWidth: "60mm",
        objectFit: "contain",
        filter: reversed ? "invert(1) brightness(1.6) grayscale(1)" : undefined,
      }}
    />
  );
}

/** Small tag chip overlaid on every photo: BEFORE / DURING WORK / AFTER */
export function TagChip({ phase }: { phase: Phase }) {
  return (
    <span
      className="doc-mono"
      style={{
        position: "absolute",
        top: "4mm",
        left: "4mm",
        fontSize: "6.5pt",
        fontWeight: 500,
        letterSpacing: "0.1em",
        color: "var(--white-a12)",
        background: "var(--black-a9)",
        padding: "1.4mm 2.6mm",
        borderRadius: "999px",
        lineHeight: 1,
      }}
    >
      {PHASE_LABEL[phase]}
    </span>
  );
}

/** A single photo cell with tag chip and optional caption. */
export function PhotoCell({
  photo,
  phase,
  className,
  style,
}: {
  photo: PhotoView;
  phase: Phase;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <figure className={className} style={{ display: "flex", flexDirection: "column", minHeight: 0, ...style }}>
      <div style={{ position: "relative", flex: 1, minHeight: 0, background: "var(--bg-element)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption ?? PHASE_LABEL[phase]}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <TagChip phase={phase} />
      </div>
      <figcaption
        style={{
          fontSize: "8.5pt",
          lineHeight: 1.4,
          color: "var(--text-muted)",
          paddingTop: "2mm",
          minHeight: "6mm",
        }}
      >
        {photo.caption ?? " "}
      </figcaption>
    </figure>
  );
}

/**
 * Interior page with header + footer chrome. Cover and back pages do not use
 * this. `dark` switches the whole page to the neutral dark scale.
 */
export function ChromePage({
  dark,
  title,
  building,
  date,
  logo,
  pageNo,
  children,
  contentStyle,
}: {
  dark: boolean;
  title: string;
  building: string;
  date: string;
  logo?: PhotoView | null;
  pageNo: number;
  children: React.ReactNode;
  contentStyle?: React.CSSProperties;
}) {
  return (
    <section className={`doc-page${dark ? " dark" : ""}`}>
      <header
        className="doc-hairline"
        style={{
          margin: "0 16mm",
          height: "12mm",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          paddingBottom: "2.5mm",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <Logo logo={logo} heightMm={5} reversed={dark} />
        <span style={{ fontSize: "8pt", color: "var(--text-muted)", fontWeight: 500 }}>{title}</span>
      </header>

      <div style={{ flex: 1, minHeight: 0, padding: "8mm 16mm", display: "flex", flexDirection: "column", ...contentStyle }}>
        {children}
      </div>

      <footer
        style={{
          margin: "0 16mm",
          height: "10mm",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          paddingTop: "2.5mm",
          borderTop: "1px solid var(--hairline)",
        }}
      >
        <span className="doc-mono" style={{ fontSize: "7pt", color: "var(--text-muted)" }}>
          {building.toUpperCase()}
        </span>
        <span className="doc-mono" style={{ fontSize: "7pt", color: "var(--text-muted)" }}>
          {fmtDate(date)} · {String(pageNo).padStart(2, "0")}
        </span>
      </footer>
    </section>
  );
}
