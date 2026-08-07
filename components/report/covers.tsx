import type { ReportView } from "@/lib/sample";
import { Logo, fmtDate } from "./primitives";
import { FocusedCover } from "./focused";
import { ImprovementCover } from "./improvement";

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
  if (r.reportNo) cols.push(["REPORT Nº", r.reportNo]);
  return (
    <div style={{ display: "flex", borderTop: `1px solid ${divider}` }}>
      {cols.map(([label, value], i) => {
        const monoValue = label === "DATE OF WORKS" || label === "REPORT Nº";
        return (
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
                fontSize: monoValue ? "8.5pt" : "9.5pt",
                fontWeight: 600,
                color: valueColor,
                marginTop: "1.6mm",
                fontFamily: monoValue ? "var(--font-mono)" : "var(--font-body)",
                letterSpacing: monoValue ? "0.06em" : undefined,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {value}
            </div>
          </div>
        );
      })}
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
            ...(r.reportNo ? ([["REPORT Nº", r.reportNo]] as [string, string][]) : []),
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
                  fontSize: label === "PREPARED BY" || label === "BUILDING" ? "9pt" : "8.5pt",
                  fontWeight: 600,
                  textAlign: "right",
                  fontFamily:
                    label === "PREPARED BY" || label === "BUILDING"
                      ? "var(--font-body)"
                      : "var(--font-mono)",
                  letterSpacing:
                    label === "PREPARED BY" || label === "BUILDING" ? undefined : "0.06em",
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

/** 6 — Flow Dark: near-black, accent display title, flowing hairline curves,
 *  accent base bar with meta and logo chip. */
export function CoverFlowDark({ r }: { r: ReportView }) {
  const curves = Array.from({ length: 9 }, (_, i) => {
    const y = 150 + i * 14;
    return (
      <path
        key={i}
        d={`M -10 ${y} C 60 ${y - 22}, 130 ${y + 22}, 220 ${y - 6}`}
        fill="none"
        stroke={i < 3 ? "var(--accent)" : "var(--sand-8)"}
        strokeWidth="0.35"
        opacity={0.25 + i * 0.08}
      />
    );
  });
  return (
    <section className="doc-page dark">
      <svg
        viewBox="0 0 210 297"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        aria-hidden
      >
        {curves}
      </svg>
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "14mm 16mm 0",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Kicker text={`/ ${fmtDate(r.date)}`} />
          {r.reportNo && <Kicker text={`REPORT Nº ${r.reportNo}`} />}
        </div>
        <div style={{ marginTop: "22mm" }}>
          <h1
            style={{
              ...displayTitle,
              fontSize: "42pt",
              letterSpacing: "-0.02em",
              color: "var(--accent)",
              maxWidth: "160mm",
            }}
          >
            {r.title}
          </h1>
          <div style={{ fontSize: "13pt", fontWeight: 600, marginTop: "7mm" }}>{r.building}</div>
          {r.preparedBy && (
            <div style={{ fontSize: "9.5pt", color: "var(--text-muted)", marginTop: "2.5mm" }}>
              Prepared by {r.preparedBy}
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          position: "relative",
          margin: "0 0 0",
          background: "var(--accent)",
          color: "var(--accent-contrast)",
          padding: "6mm 16mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ ...monoMeta, color: "var(--accent-contrast)" }}>
          {r.building.toUpperCase()} · {fmtDate(r.date)}
        </span>
        {r.logo && (
          <span
            style={{
              // fixed light chip so the logo reads on any accent, in any scope
              background: "var(--white-a12)",
              borderRadius: "2.5mm",
              padding: "2mm 3.5mm",
              display: "inline-flex",
            }}
          >
            <Logo logo={r.logo} heightMm={6} />
          </span>
        )}
      </div>
    </section>
  );
}

/** 7 — Quiet Caps: letterspaced capitals centred over the darkened photo. */
export function CoverQuietCaps({ r }: { r: ReportView }) {
  return (
    <section className="doc-page dark">
      <div style={{ position: "absolute", inset: 0, background: "var(--bg-element)" }}>
        {r.buildingPhoto && (
          <Photo url={r.buildingPhoto.url} style={{ filter: "grayscale(0.35) brightness(0.9)" }} />
        )}
      </div>
      <div style={{ position: "absolute", inset: 0, background: "var(--black-a10)" }} />
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "14mm 16mm",
        }}
      >
        <Logo logo={r.logo} heightMm={7} reversed />
        <div style={{ width: "1px", height: "34mm", background: "var(--white-a8)", marginTop: "10mm" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "22pt",
              fontWeight: 500,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              textAlign: "center",
              lineHeight: 1.6,
              color: "var(--white-a12)",
              margin: 0,
              maxWidth: "165mm",
            }}
          >
            {r.title}
          </h1>
          <AccentDash style={{ margin: "9mm 0", background: "var(--white-a11)" }} />
          <div style={{ ...monoMeta, color: "var(--white-a11)", textAlign: "center" }}>
            {r.building.toUpperCase()}
          </div>
          {r.reportNo && (
            <div style={{ ...monoMeta, color: "var(--white-a9)", marginTop: "3mm" }}>
              REPORT Nº {r.reportNo}
            </div>
          )}
        </div>
        <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ ...monoLabel, color: "var(--white-a9)" }}>BUILDING</div>
            <div style={{ fontSize: "9.5pt", fontWeight: 600, color: "var(--white-a12)", marginTop: "1.6mm" }}>
              {r.building}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ ...monoLabel, color: "var(--white-a9)" }}>DATE OF WORKS</div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em",
                fontSize: "8.5pt",
                fontWeight: 500,
                color: "var(--white-a12)",
                marginTop: "1.6mm",
              }}
            >
              {fmtDate(r.date)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 8 — Accent Panel: solid accent panel overlapping the building photo. */
export function CoverAccentPanel({ r }: { r: ReportView }) {
  return (
    <section className="doc-page">
      <div style={{ position: "absolute", inset: 0, background: "var(--bg-element)" }}>
        {r.buildingPhoto && <Photo url={r.buildingPhoto.url} />}
      </div>
      <div
        style={{
          position: "absolute",
          top: "12mm",
          left: "12mm",
          bottom: "12mm",
          width: "108mm",
          background: "var(--accent)",
          color: "var(--accent-contrast)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "12mm 10mm",
        }}
      >
        <div>
          {r.logo && (
            <span
              style={{
                background: "var(--sand-1)",
                borderRadius: "2.5mm",
                padding: "2.5mm 4mm",
                display: "inline-flex",
              }}
            >
              <Logo logo={r.logo} heightMm={7} />
            </span>
          )}
          <h1
            style={{
              ...displayTitle,
              fontSize: "27pt",
              color: "var(--accent-contrast)",
              marginTop: "12mm",
            }}
          >
            {r.title}
          </h1>
          <div style={{ fontSize: "10.5pt", marginTop: "6mm", opacity: 0.92 }}>{r.building}</div>
          {r.preparedBy && (
            <div style={{ fontSize: "9pt", marginTop: "2mm", opacity: 0.75 }}>
              Prepared by {r.preparedBy}
            </div>
          )}
        </div>
        <div
          style={{
            borderTop: "1px solid color-mix(in srgb, var(--accent-contrast) 35%, transparent)",
            paddingTop: "4mm",
            ...monoMeta,
            color: "var(--accent-contrast)",
            opacity: 0.9,
          }}
        >
          {fmtDate(r.date)}
          {r.reportNo ? ` · Nº ${r.reportNo}` : ""}
        </div>
      </div>
    </section>
  );
}

/** 9 — Collage Card: before/during/after strips behind a centred card. */
export function CoverCollageCard({ r }: { r: ReportView }) {
  const strips = [r.photos.before[0], r.photos.during[0], r.photos.after[0]].filter(
    (p): p is NonNullable<typeof p> => !!p,
  );
  const bg = strips.length ? strips : r.buildingPhoto ? [r.buildingPhoto] : [];
  return (
    <section className="doc-page">
      <div style={{ position: "absolute", inset: 0, display: "flex", background: "var(--bg-element)" }}>
        {bg.map((p, i) => (
          <div key={i} style={{ flex: 1, height: "100%", overflow: "hidden", borderLeft: i ? "1px solid var(--sand-1)" : "none" }}>
            <Photo url={p.url} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", inset: 0, background: "var(--black-a6)" }} />
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "122mm",
            background: "var(--sand-1)",
            borderRadius: "4mm",
            padding: "12mm 11mm 9mm",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxShadow: "0 2mm 8mm var(--black-a6)",
          }}
        >
          <Logo logo={r.logo} heightMm={8} />
          <h1 style={{ ...displayTitle, fontSize: "20pt", marginTop: "7mm" }}>{r.title}</h1>
          <div style={{ fontSize: "10pt", color: "var(--text-muted)", marginTop: "3.5mm" }}>{r.building}</div>
          <div style={{ display: "flex", gap: "2.5mm", marginTop: "7mm" }}>
            {(["BEFORE", "DURING", "AFTER"] as const).map((tag) => (
              <span
                key={tag}
                className="doc-mono"
                style={{
                  fontSize: "6.5pt",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  padding: "1.6mm 3.2mm",
                  borderRadius: "999px",
                  background: "var(--bg-element)",
                  color: "var(--text)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div
            style={{
              alignSelf: "stretch",
              borderTop: "1px solid var(--hairline)",
              marginTop: "8mm",
              paddingTop: "4mm",
              ...monoMeta,
              color: "var(--text-muted)",
            }}
          >
            {fmtDate(r.date)}
            {r.reportNo ? ` · Nº ${r.reportNo}` : ""}
          </div>
        </div>
      </div>
    </section>
  );
}

/** 10 — Filmstrip: light cover, vertical tagged photo strip on the right. */
export function CoverFilmstrip({ r }: { r: ReportView }) {
  const shots: { p: NonNullable<ReportView["buildingPhoto"]>; tag: string }[] = [];
  if (r.photos.before[0]) shots.push({ p: r.photos.before[0], tag: "BEFORE" });
  if (r.photos.during[0]) shots.push({ p: r.photos.during[0], tag: "DURING WORK" });
  if (r.photos.after[0]) shots.push({ p: r.photos.after[0], tag: "AFTER" });
  if (!shots.length && r.buildingPhoto) shots.push({ p: r.buildingPhoto, tag: "BUILDING" });
  return (
    <section className="doc-page" style={{ flexDirection: "row" }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "14mm 10mm 14mm 16mm",
        }}
      >
        <Logo logo={r.logo} heightMm={9} />
        <div>
          <Kicker text={`CLEANING REPORT${r.reportNo ? ` · Nº ${r.reportNo}` : ""}`} />
          <h1 style={{ ...displayTitle, fontSize: "27pt", marginTop: "5mm" }}>{r.title}</h1>
          <div style={{ fontSize: "10.5pt", color: "var(--text-muted)", marginTop: "5mm" }}>{r.building}</div>
        </div>
        <div>
          {([
            ["DATE OF WORKS", fmtDate(r.date), true],
            ...(r.preparedBy ? ([["PREPARED BY", r.preparedBy, false]] as [string, string, boolean][]) : []),
          ] as [string, string, boolean][]).map(([label, value, mono]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "2.8mm 0",
                borderTop: "1px solid var(--hairline)",
              }}
            >
              <span style={monoLabel}>{label}</span>
              <span
                style={{
                  fontSize: mono ? "8.5pt" : "9pt",
                  fontWeight: 600,
                  fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
                  letterSpacing: mono ? "0.06em" : undefined,
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div
        className="dark"
        style={{
          width: "72mm",
          background: "var(--bg)",
          display: "flex",
          flexDirection: "column",
          padding: "5mm",
          gap: "5mm",
        }}
      >
        {shots.map(({ p, tag }) => (
          <div key={tag} style={{ position: "relative", flex: 1, overflow: "hidden", borderRadius: "2mm" }}>
            <Photo url={p.url} style={{ position: "absolute", inset: 0, height: "100%" }} />
            <span
              className="doc-mono"
              style={{
                position: "absolute",
                top: "3mm",
                left: "3mm",
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
              {tag}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Cover({ r }: { r: ReportView }) {
  switch (r.templateId) {
    case "improvement":
      return <ImprovementCover r={r} />;
    case "focused-photo":
    case "focused-card":
    case "focused-scrim":
      return <FocusedCover r={r} />;
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
    case "flow-dark":
      return <CoverFlowDark r={r} />;
    case "quiet-caps":
      return <CoverQuietCaps r={r} />;
    case "accent-panel":
      return <CoverAccentPanel r={r} />;
    case "collage-card":
      return <CoverCollageCard r={r} />;
    case "filmstrip":
      return <CoverFilmstrip r={r} />;
  }
}
