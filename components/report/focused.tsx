import type { Phase } from "@/lib/types";
import { PHASE_LABEL } from "@/lib/types";
import type { PhotoView, ReportView } from "@/lib/sample";
import { fitBox } from "./primitives";

/** The reference reports use full-month dates: "5 JULY 2026". */
const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();
};

/* ---------------------------------------------------------------------------
   The "Focused" family — a faithful replication of the client's own report
   templates: light chrome on EVERY page (logo left, BUILDING · CLEANING
   REPORT right, company + WORKS COMPLETED footer), rounded photo cards, one
   large photo per page with a coloured phase pill beneath, bold headings with
   a heavy rule, and a centred "Thank you." last page.
--------------------------------------------------------------------------- */

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.12em",
  fontSize: "6.5pt",
  fontWeight: 500,
};

const TAG_COLOR: Record<Phase, string> = {
  before: "var(--tag-before)",
  during: "var(--tag-during)",
  after: "var(--tag-after)",
  general: "transparent",
};

const CONTENT_W = 182; // 210 − 2×14mm margins

function Img({ url, style }: { url: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }} />;
}

/** Coloured phase pill, placed under photos exactly like the references. */
export function PhasePill({ phase }: { phase: Phase }) {
  if (!PHASE_LABEL[phase]) return null;
  return (
    <span
      style={{
        ...mono,
        display: "inline-block",
        color: "#ffffff",
        background: TAG_COLOR[phase],
        padding: "1.6mm 3.2mm",
        borderRadius: "999px",
        lineHeight: 1,
      }}
    >
      {PHASE_LABEL[phase]}
    </span>
  );
}

/** Every page of the family shares this chrome, including cover and back. */
export function FocusedPage({ r, children }: { r: ReportView; children: React.ReactNode }) {
  return (
    <section className="doc-page">
      <header
        style={{
          margin: "0 14mm",
          height: "14mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        {r.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.logo.url} alt="" style={{ height: "8mm", width: "auto", maxWidth: "40mm", objectFit: "contain" }} />
        ) : (
          <span />
        )}
        <span style={{ ...mono, color: "var(--text-muted)" }}>
          {r.building.toUpperCase()} · CLEANING REPORT
        </span>
      </header>

      <div style={{ flex: 1, minHeight: 0, padding: "6mm 14mm", display: "flex", flexDirection: "column" }}>
        {children}
      </div>

      <footer
        style={{
          margin: "0 14mm",
          height: "12mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid var(--hairline)",
        }}
      >
        <span style={{ ...mono, color: "var(--text-muted)" }}>
          {(r.company?.name ?? "").toUpperCase()}
        </span>
        <span style={{ ...mono, color: "var(--text-muted)" }}>
          WORKS COMPLETED · {fmtDate(r.date)}
        </span>
      </footer>
    </section>
  );
}

/** White-on-photo labelled meta columns (cover bases). */
function PhotoMetaColumns({ cols }: { cols: [string, string][] }) {
  return (
    <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.28)" }}>
      {cols.map(([label, value], i) => (
        <div
          key={label}
          style={{
            flex: 1,
            padding: "3mm 0 0",
            marginRight: i < cols.length - 1 ? "5mm" : 0,
            paddingLeft: i > 0 ? "5mm" : 0,
            borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.28)" : "none",
            minWidth: 0,
          }}
        >
          <div style={{ ...mono, color: "rgba(255,255,255,0.75)" }}>{label}</div>
          <div
            style={{
              fontSize: "9pt",
              fontWeight: 700,
              color: "#ffffff",
              marginTop: "1.4mm",
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

const coverMeta = (r: ReportView, withBuilding = false): [string, string][] => {
  const cols: [string, string][] = [];
  if (withBuilding) cols.push(["BUILDING", r.building]);
  if (r.level) cols.push(["LEVEL", r.level]);
  if (r.area) cols.push(["AREA", r.area]);
  cols.push(["DATE OF WORKS", fmtDate(r.date)]);
  if (r.preparedBy) cols.push(["PREPARED BY", r.preparedBy]);
  return cols.slice(0, 4);
};

const chipStyle: React.CSSProperties = {
  ...mono,
  position: "absolute",
  top: "6mm",
  right: "6mm",
  color: "#ffffff",
  background: "rgba(10,10,10,0.55)",
  padding: "1.8mm 3.2mm",
  borderRadius: "1.5mm",
};

/** Cover 1 — full photo card, building pill + white title over the image. */
export function FocusedCoverPhoto({ r }: { r: ReportView }) {
  return (
    <FocusedPage r={r}>
      <div
        style={{
          flex: 1,
          position: "relative",
          borderRadius: "4mm",
          overflow: "hidden",
          background: "var(--sand-11)",
        }}
      >
        {r.buildingPhoto && (
          <Img url={r.buildingPhoto.url} style={{ position: "absolute", inset: 0, height: "100%", filter: "grayscale(1) contrast(1.05)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.72) 100%)" }} />
        <span style={chipStyle}>CLEANING REPORT</span>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "8mm" }}>
          <span
            style={{
              ...mono,
              display: "inline-block",
              color: "#ffffff",
              background: "var(--accent)",
              padding: "1.8mm 3.4mm",
              borderRadius: "999px",
              marginBottom: "4mm",
            }}
          >
            {r.building.toUpperCase()}
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "26pt",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              color: "#ffffff",
              margin: "0 0 6mm",
              maxWidth: "150mm",
            }}
          >
            {r.title}
          </h1>
          <PhotoMetaColumns cols={coverMeta(r)} />
        </div>
      </div>
    </FocusedPage>
  );
}

/** Cover 2 — photo card with an overlapping white spec card. */
export function FocusedCoverCard({ r }: { r: ReportView }) {
  const cols = coverMeta(r).filter(([label]) => label !== "PREPARED BY").slice(0, 3);
  return (
    <FocusedPage r={r}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flex: 1,
            position: "relative",
            borderRadius: "4mm",
            background: "var(--sand-11)",
          }}
        >
          <div style={{ position: "absolute", inset: 0, borderRadius: "4mm", overflow: "hidden" }}>
            {r.buildingPhoto && <Img url={r.buildingPhoto.url} style={{ position: "absolute", inset: 0, height: "100%" }} />}
            <span style={chipStyle}>CLEANING REPORT</span>
          </div>
          {/* Overlapping white spec card */}
          <div
            style={{
              position: "absolute",
              left: "8mm",
              right: "8mm",
              bottom: "-12mm",
              background: "#ffffff",
              borderRadius: "3.5mm",
              boxShadow: "0 3mm 9mm rgba(0,0,0,0.16)",
              padding: "8mm 9mm 7mm",
            }}
          >
            <div style={{ ...mono, color: "var(--accent)", marginBottom: "3mm" }}>
              {r.building.toUpperCase()}
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20pt",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
                margin: "0 0 6mm",
                color: "var(--text)",
              }}
            >
              {r.title}
            </h1>
            <div style={{ display: "flex", borderTop: "1px solid var(--hairline)" }}>
              {cols.map(([label, value], i) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    padding: "3mm 0 0",
                    marginRight: i < cols.length - 1 ? "5mm" : 0,
                    paddingLeft: i > 0 ? "5mm" : 0,
                    borderLeft: i > 0 ? "1px solid var(--hairline)" : "none",
                    minWidth: 0,
                  }}
                >
                  <div style={{ ...mono, color: "var(--text-muted)" }}>{label}</div>
                  <div style={{ fontSize: "9pt", fontWeight: 700, marginTop: "1.4mm", color: "var(--text)" }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: "18mm",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ ...mono, color: "var(--text-muted)" }}>
            {r.preparedBy ? `PREPARED BY · ${r.preparedBy.toUpperCase()}` : ""}
          </span>
          <span style={{ ...mono, color: "var(--text-muted)" }}>BEFORE · DURING · AFTER</span>
        </div>
      </div>
    </FocusedPage>
  );
}

/** Cover 3 — photo card under a dark scrim, brand kicker, white meta row. */
export function FocusedCoverScrim({ r }: { r: ReportView }) {
  return (
    <FocusedPage r={r}>
      <div
        style={{
          flex: 1,
          position: "relative",
          borderRadius: "4mm",
          overflow: "hidden",
          background: "var(--sand-12)",
        }}
      >
        {r.buildingPhoto && (
          <Img url={r.buildingPhoto.url} style={{ position: "absolute", inset: 0, height: "100%", filter: "brightness(0.82) saturate(0.9)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(6,10,18,0.35) 0%, rgba(6,10,18,0.45) 55%, rgba(6,10,18,0.88) 100%)" }} />
        <span style={chipStyle}>CLEANING REPORT</span>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "8mm" }}>
          <div style={{ ...mono, color: "var(--accent)", marginBottom: "3.5mm" }}>
            {(r.company?.name ?? "").toUpperCase()} · CLEANING REPORT
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "24pt",
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: "-0.01em",
              color: "#ffffff",
              margin: "0 0 7mm",
              maxWidth: "150mm",
            }}
          >
            {r.title}
          </h1>
          <PhotoMetaColumns cols={coverMeta(r, true).slice(0, 3)} />
        </div>
      </div>
    </FocusedPage>
  );
}

/** Bold section heading with the heavy rule: `01  Before`. */
export function FocusedHeading({ index, title }: { index: string; title: string }) {
  return (
    <div style={{ marginBottom: "5mm" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "3mm", marginBottom: "2.5mm" }}>
        <span style={{ ...mono, color: "var(--accent)" }}>{index}</span>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "14pt",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            margin: 0,
            color: "var(--text)",
          }}
        >
          {title}
        </h2>
      </div>
      <div style={{ height: "0.6mm", background: "var(--text)" }} />
    </div>
  );
}

/** One large rounded photo with its phase pill beneath (the family's core page). */
export function FocusedPhotoBlock({
  photo,
  phase,
  boxH,
}: {
  photo: PhotoView;
  phase: Phase;
  boxH: number;
}) {
  const { w, h } = fitBox(photo.width, photo.height, CONTENT_W, boxH);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <div
        style={{
          width: `${w}mm`,
          height: `${h}mm`,
          borderRadius: "3mm",
          overflow: "hidden",
          alignSelf: "center",
        }}
      >
        <Img url={photo.url} />
      </div>
      {(PHASE_LABEL[phase] || photo.caption) && (
        <div style={{ display: "flex", alignItems: "center", gap: "3mm", marginTop: "4mm" }}>
          <PhasePill phase={phase} />
          {photo.caption && (
            <span style={{ fontSize: "8.5pt", color: "var(--text-muted)" }}>{photo.caption}</span>
          )}
        </div>
      )}
    </div>
  );
}

/** Last page — centred bold "Thank you." exactly like the references. */
export function FocusedThankYou({ r }: { r: ReportView }) {
  const remarks = r.remarks?.trim();
  return (
    <FocusedPage r={r}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10mm",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "22pt",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "var(--text)",
          }}
        >
          Thank you.
        </div>
        {remarks ? (
          <div style={{ maxWidth: "130mm" }}>
            <div style={{ ...mono, color: "var(--text-muted)", marginBottom: "2.5mm" }}>REMARKS</div>
            <p style={{ fontSize: "10pt", lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0, color: "var(--text)" }}>
              {remarks}
            </p>
          </div>
        ) : null}
      </div>
    </FocusedPage>
  );
}

/** Optional scope page in the family style. */
export function FocusedScope({ r }: { r: ReportView }) {
  return (
    <FocusedPage r={r}>
      <FocusedHeading index="—" title="Scope of works" />
      <p style={{ fontSize: "10.5pt", lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0, maxWidth: "155mm" }}>
        {r.scope}
      </p>
    </FocusedPage>
  );
}

export function FocusedCover({ r }: { r: ReportView }) {
  switch (r.templateId) {
    case "focused-card":
      return <FocusedCoverCard r={r} />;
    case "focused-scrim":
      return <FocusedCoverScrim r={r} />;
    default:
      return <FocusedCoverPhoto r={r} />;
  }
}
