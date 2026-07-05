import type { ReportView } from "@/lib/sample";
import { Logo, fmtDate } from "./primitives";

/* ---------------------------------------------------------------------------
   Five cover treatments. All share the same type system and 16mm grid so the
   family reads as one product. Tokens only — no literal colours.
--------------------------------------------------------------------------- */

const heroTitle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "34pt",
  lineHeight: 1.05,
  letterSpacing: "-0.02em",
  fontWeight: 600,
  margin: 0,
};

const monoMeta: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.1em",
  fontSize: "8pt",
  fontWeight: 500,
};

function Photo({ url, style }: { url: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }} />;
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
            "linear-gradient(to bottom, var(--black-a8) 0%, var(--black-a5) 35%, var(--black-a8) 62%, var(--black-a11) 100%)",
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
          color: "var(--sand-12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Logo logo={r.logo} heightMm={8} reversed />
          <span style={{ ...monoMeta, color: "var(--white-a11)" }}>CLEANING WORKS REPORT</span>
        </div>
        <div>
          <div style={{ ...monoMeta, color: "var(--white-a11)", marginBottom: "6mm" }}>{fmtDate(r.date)}</div>
          <h1 style={{ ...heroTitle, fontSize: "38pt", color: "var(--white-a12)" }}>{r.title}</h1>
          <div
            style={{
              marginTop: "8mm",
              paddingTop: "5mm",
              borderTop: "1px solid var(--white-a8)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <span style={{ fontSize: "11pt", fontWeight: 500, color: "var(--white-a12)" }}>{r.building}</span>
            {r.preparedBy && (
              <span style={{ fontSize: "8.5pt", color: "var(--white-a10)" }}>Prepared by {r.preparedBy}</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** 2 — Image Hero, light panel: photo top two-thirds, light panel below. */
export function CoverHeroLight({ r }: { r: ReportView }) {
  return (
    <section className="doc-page">
      <div style={{ height: "66%", background: "var(--bg-element)", position: "relative" }}>
        {r.buildingPhoto && <Photo url={r.buildingPhoto.url} />}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "10mm 16mm 14mm",
          borderTop: "1px solid var(--hairline)",
        }}
      >
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6mm" }}>
            <span style={{ ...monoMeta, color: "var(--text-muted)" }}>CLEANING WORKS REPORT</span>
            <span style={{ ...monoMeta, color: "var(--text-muted)" }}>{fmtDate(r.date)}</span>
          </div>
          <h1 style={heroTitle}>{r.title}</h1>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: "11pt", fontWeight: 500 }}>{r.building}</div>
            {r.preparedBy && (
              <div style={{ fontSize: "8.5pt", color: "var(--text-muted)", marginTop: "1.5mm" }}>
                Prepared by {r.preparedBy}
              </div>
            )}
          </div>
          <Logo logo={r.logo} heightMm={8} />
        </div>
      </div>
    </section>
  );
}

/** 3 — Minimal Light: no cover photo, oversized display title, hairlines. */
export function CoverMinimalLight({ r }: { r: ReportView }) {
  return (
    <section className="doc-page">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16mm" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingBottom: "6mm",
            borderBottom: "1px solid var(--hairline)",
          }}
        >
          <Logo logo={r.logo} heightMm={8} />
          <span style={{ ...monoMeta, color: "var(--text-muted)" }}>CLEANING WORKS REPORT</span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ ...monoMeta, color: "var(--text-muted)", marginBottom: "8mm" }}>{fmtDate(r.date)}</div>
          <h1 style={{ ...heroTitle, fontSize: "46pt", letterSpacing: "-0.025em" }}>{r.title}</h1>
          <div style={{ fontSize: "13pt", color: "var(--text-muted)", marginTop: "8mm", fontWeight: 450 }}>
            {r.building}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingTop: "6mm",
            borderTop: "1px solid var(--hairline)",
          }}
        >
          <span style={{ fontSize: "8.5pt", color: "var(--text-muted)" }}>
            {r.preparedBy ? `Prepared by ${r.preparedBy}` : ""}
          </span>
          {r.buildingPhoto && (
            <div style={{ width: "42mm", height: "30mm", border: "1px solid var(--hairline)", padding: "1.5mm" }}>
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
          <span style={{ ...monoMeta, color: "var(--text-muted)" }}>CLEANING WORKS REPORT</span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ width: "18mm", height: "2px", background: "var(--accent)", marginBottom: "10mm" }} />
          <div style={{ ...monoMeta, color: "var(--text-muted)", marginBottom: "8mm" }}>{fmtDate(r.date)}</div>
          <h1 style={{ ...heroTitle, fontSize: "42pt", letterSpacing: "-0.025em" }}>{r.title}</h1>
          <div style={{ fontSize: "13pt", color: "var(--text-muted)", marginTop: "8mm", fontWeight: 450 }}>
            {r.building}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: "6mm",
            borderTop: "1px solid var(--hairline)",
          }}
        >
          <span style={{ fontSize: "8.5pt", color: "var(--text-muted)" }}>
            {r.preparedBy ? `Prepared by ${r.preparedBy}` : ""}
          </span>
          <span style={{ ...monoMeta, color: "var(--text-tertiary)" }}>BEFORE · DURING · AFTER</span>
        </div>
      </div>
    </section>
  );
}

/** 5 — Editorial Split: photo left half, typographic block right half. */
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
          borderLeft: "1px solid var(--hairline)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "5mm" }}>
          <Logo logo={r.logo} heightMm={8} />
          <span style={{ ...monoMeta, color: "var(--text-muted)" }}>CLEANING WORKS REPORT</span>
        </div>

        <div>
          <div style={{ ...monoMeta, color: "var(--text-muted)", marginBottom: "6mm" }}>{fmtDate(r.date)}</div>
          <h1 style={{ ...heroTitle, fontSize: "27pt" }}>{r.title}</h1>
          <div style={{ fontSize: "10.5pt", color: "var(--text-muted)", marginTop: "6mm" }}>{r.building}</div>
        </div>

        <div style={{ paddingTop: "5mm", borderTop: "1px solid var(--hairline)" }}>
          <span style={{ fontSize: "8.5pt", color: "var(--text-muted)" }}>
            {r.preparedBy ? `Prepared by ${r.preparedBy}` : ""}
          </span>
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
