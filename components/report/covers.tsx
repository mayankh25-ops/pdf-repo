import type { ReportView } from "@/lib/sample";
import { Logo, fmtDate } from "./primitives";

/* ---------------------------------------------------------------------------
   Five cover treatments. All share the same type system, the 16mm grid and a
   family of motifs (accent dash, mono kicker, labelled meta columns) so they
   read as one product. Tokens only — no literal colours.
--------------------------------------------------------------------------- */

const displayTitle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "34pt",
  lineHeight: 1.04,
  letterSpacing: "-0.02em",
  fontWeight: 700,
  margin: 0,
};

const monoMeta: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.1em",
  fontSize: "8pt",
  fontWeight: 500,
};

const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.12em",
  fontSize: "6.5pt",
  fontWeight: 500,
  color: "var(--text-muted)",
};

function Photo({ url, style }: { url: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }} />;
}

/** Short accent dash above titles — the single swappable accent token. */
function AccentDash({ style }: { style?: React.CSSProperties }) {
  return <div style={{ width: "9mm", height: "1.2mm", background: "var(--accent)", ...style }} />;
}

/** Mono kicker line: CLEANING WORKS REPORT — date. */
function Kicker({ text, color }: { text: string; color?: string }) {
  return <span style={{ ...monoMeta, color: color ?? "var(--text-muted)" }}>{text}</span>;
}

/**
 * Labelled meta columns (BUILDING / DATE OF WORKS / PREPARED BY) — tiny mono
 * labels over emphasised values, split by hairlines.
 */
function MetaColumns({
  r,
  divider = "var(--hairline)",
  valueColor = "var(--text)",
}: {
  r: ReportView;
  divider?: string;
  valueColor?: string;
}) {
  const cols: [string, string][] = [
    ["BUILDING", r.building],
    ["DATE OF WORKS", fmtDate(r.date)],
  ];
  if (r.preparedBy) cols.push(["PREPARED BY", r.preparedBy]);
  return (
    <div style={{ display: "flex", borderTop: `1px solid ${divider}` }}>
      {cols.map(([label, value], i) => (
        <div
          key={label}
          style={{
            flex: label === "BUILDING" ? 1.4 : 1,
            padding: "3.5mm 0 0",
            marginRight: i < cols.length - 1 ? "6mm" : 0,
            paddingLeft: i > 0 ? "6mm" : 0,
            borderLeft: i > 0 ? `1px solid ${divider}` : "none",
            minWidth: 0,
          }}
        >
          <div style={monoLabel}>{label}</div>
          <div
            style={{
              fontSize: label === "DATE OF WORKS" ? "8.5pt" : "9.5pt",
              fontWeight: 600,
              color: valueColor,
              marginTop: "1.6mm",
              fontFamily: label === "DATE OF WORKS" ? "var(--font-mono)" : "var(--font-body)",
              letterSpacing: label === "DATE OF WORKS" ? "0.06em" : undefined,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

/** 1 — Image Hero, dark scrim: full-bleed photo, dark gradient, light type. */
export function CoverHeroDark({ r }: { r: ReportView }) {
  return (
    <section className="doc-page dark">
      <div style={{ position: "absolute", inset: 0, background: "var(--bg-element)" }}>
        {r.buildingPhoto && <Photo url={r.buildingPhoto.url} />}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, var(--black-a8) 0%, var(--black-a5) 35%, var(--black-a9) 62%, var(--black-a12) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "16mm",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Logo logo={r.logo} heightMm={8} reversed />
          <Kicker text="CLEANING WORKS REPORT" color="var(--white-a11)" />
        </div>
        <div>
          <AccentDash style={{ marginBottom: "5mm", background: "var(--white-a12)" }} />
          <div style={{ ...monoMeta, color: "var(--white-a11)", marginBottom: "4mm" }}>
            {fmtDate(r.date)}
          </div>
          <h1 style={{ ...displayTitle, fontSize: "36pt", color: "var(--white-a12)", maxWidth: "160mm" }}>
            {r.title}
          </h1>
          <div style={{ marginTop: "9mm" }}>
            <MetaColumns r={r} divider="var(--white-a7)" valueColor="var(--white-a12)" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** 2 — Image Hero, light panel: photo top two-thirds, light panel below,
 *  logo chip overlapping the photo edge. */
export function CoverHeroLight({ r }: { r: ReportView }) {
  return (
    <section className="doc-page">
      <div style={{ height: "62%", background: "var(--bg-element)", position: "relative" }}>
        {r.buildingPhoto && <Photo url={r.buildingPhoto.url} />}
        <div
          style={{
            position: "absolute",
            top: "10mm",
            right: "16mm",
            ...monoMeta,
            color: "var(--white-a12)",
            background: "var(--black-a8)",
            padding: "2mm 3.5mm",
            borderRadius: "999px",
          }}
        >
          CLEANING WORKS REPORT
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "0 16mm 14mm",
          borderTop: "1px solid var(--hairline)",
          position: "relative",
        }}
      >
        {/* Overlapping logo chip */}
        <div
          style={{
            position: "absolute",
            top: "-9mm",
            left: "16mm",
            background: "var(--bg)",
            border: "1px solid var(--hairline)",
            borderRadius: "3mm",
            padding: "3mm 4.5mm",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Logo logo={r.logo} heightMm={8} />
        </div>
        <div style={{ marginTop: "16mm" }}>
          <div style={{ ...monoMeta, color: "var(--text-muted)", marginBottom: "4mm" }}>
            {fmtDate(r.date)}
          </div>
          <h1 style={displayTitle}>{r.title}</h1>
        </div>
        <MetaColumns r={r} />
      </div>
    </section>
  );
}

/** 3 — Minimal Light: no cover photo — poster type with ghost initials,
 *  oversized display title, hairline rules, small building thumbnail inset. */
export function CoverMinimalLight({ r }: { r: ReportView }) {
  const initials = r.building
    .split(/\s+/)
    .map((w) => w[0])
    .filter((c) => /[A-Za-z0-9]/.test(c ?? ""))
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <section className="doc-page">
      {/* Ghost poster type */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "8mm",
          right: "-6mm",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "180pt",
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: "var(--bg-element)",
          userSelect: "none",
        }}
      >
        {initials}
      </div>
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", padding: "16mm" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Logo logo={r.logo} heightMm={8} />
          <Kicker text={`CLEANING REPORT — ${fmtDate(r.date)}`} />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "12mm" }}>
          <AccentDash style={{ marginBottom: "6mm" }} />
          <h1 style={{ ...displayTitle, fontSize: "44pt", letterSpacing: "-0.025em", maxWidth: "150mm" }}>
            {r.title}
          </h1>
          <div style={{ fontSize: "11pt", color: "var(--text-muted)", marginTop: "6mm", fontWeight: 500 }}>
            {r.building}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: "8mm" }}>
          <div style={{ flex: 1 }}>
            <MetaColumns r={r} />
          </div>
          {r.buildingPhoto && (
            <div
              style={{
                width: "38mm",
                height: "27mm",
                border: "1px solid var(--hairline)",
                padding: "1.5mm",
                flexShrink: 0,
              }}
            >
              <Photo url={r.buildingPhoto.url} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** 4 — Minimal Dark: near-black, light type, reversed logo, thin accent rule. */
export function CoverMinimalDark({ r }: { r: ReportView }) {
  return (
    <section className="doc-page dark">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16mm" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Logo logo={r.logo} heightMm={8} reversed />
          <Kicker text="CLEANING WORKS REPORT" />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <AccentDash style={{ marginBottom: "9mm" }} />
          <div style={{ ...monoMeta, color: "var(--text-muted)", marginBottom: "6mm" }}>
            {fmtDate(r.date)}
          </div>
          <h1 style={{ ...displayTitle, fontSize: "40pt", letterSpacing: "-0.025em", maxWidth: "160mm" }}>
            {r.title}
          </h1>
          <div style={{ fontSize: "12pt", color: "var(--text-muted)", marginTop: "7mm", fontWeight: 450 }}>
            {r.building}
          </div>
        </div>

        <div>
          <MetaColumns r={r} />
          <div
            style={{
              marginTop: "5mm",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <span style={{ ...monoMeta, color: "var(--text-tertiary)" }}>BEFORE · DURING · AFTER</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 5 — Editorial Split: photo left half, typographic block right half,
 *  thin accent rule on the split. */
export function CoverEditorialSplit({ r }: { r: ReportView }) {
  return (
    <section className="doc-page" style={{ flexDirection: "row" }}>
      <div style={{ width: "50%", height: "100%", background: "var(--bg-element)", position: "relative" }}>
        {r.buildingPhoto && <Photo url={r.buildingPhoto.url} />}
      </div>
      <div
        style={{
          width: "50%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "16mm 12mm",
          borderLeft: "1.2mm solid var(--accent)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "5mm", alignItems: "flex-start" }}>
          <Logo logo={r.logo} heightMm={8} />
          <Kicker text="CLEANING WORKS REPORT" />
        </div>

        <div>
          <div style={{ ...monoMeta, color: "var(--text-muted)", marginBottom: "5mm" }}>
            {fmtDate(r.date)}
          </div>
          <h1 style={{ ...displayTitle, fontSize: "26pt" }}>{r.title}</h1>
        </div>

        {/* Stacked label/value meta rows */}
        <div>
          {([
            ["BUILDING", r.building],
            ["DATE OF WORKS", fmtDate(r.date)],
            ...(r.preparedBy ? ([["PREPARED BY", r.preparedBy]] as [string, string][]) : []),
          ] as [string, string][]).map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "4mm",
                padding: "2.8mm 0",
                borderTop: "1px solid var(--hairline)",
              }}
            >
              <span style={monoLabel}>{label}</span>
              <span
                style={{
                  fontSize: label === "DATE OF WORKS" ? "8.5pt" : "9pt",
                  fontWeight: 600,
                  textAlign: "right",
                  fontFamily: label === "DATE OF WORKS" ? "var(--font-mono)" : "var(--font-body)",
                  letterSpacing: label === "DATE OF WORKS" ? "0.06em" : undefined,
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Cover({ r }: { r: ReportView }) {
  switch (r.templateId) {
    case "hero-dark":
      return <CoverHeroDark r={r} />;
    case "hero-light":
      return <CoverHeroLight r={r} />;
    case "minimal-light":
      return <CoverMinimalLight r={r} />;
    case "minimal-dark":
      return <CoverMinimalDark r={r} />;
    case "editorial-split":
      return <CoverEditorialSplit r={r} />;
  }
}
