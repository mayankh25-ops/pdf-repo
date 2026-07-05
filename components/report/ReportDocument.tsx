import type { Phase } from "@/lib/types";
import { PHASES, PHASE_TITLE } from "@/lib/types";
import { getTemplate } from "@/lib/templates";
import type { PhotoView, ReportView } from "@/lib/sample";
import { ChromePage, Logo, PhotoCell, fmtDate } from "./primitives";
import { Cover } from "./covers";

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const SECTION_INDEX: Record<Phase, string> = { before: "01", during: "02", after: "03" };

/** Section divider page, styled to the template family (light/dark chrome). */
function Divider({
  dark,
  index,
  heading,
  count,
  building,
}: {
  dark: boolean;
  index: string;
  heading: string;
  count: number;
  building: string;
}) {
  return (
    <section className={`doc-page${dark ? " dark" : ""}`}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16mm" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
            fontSize: "8pt",
            color: "var(--text-muted)",
            paddingBottom: "5mm",
            borderBottom: "1px solid var(--hairline)",
          }}
        >
          SECTION {index}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "88pt",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: "var(--text-tertiary)",
              opacity: 0.55,
            }}
          >
            {index}
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "32pt",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: "4mm 0 0",
            }}
          >
            {heading}
          </h2>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
              fontSize: "8pt",
              color: "var(--text-muted)",
              marginTop: "6mm",
            }}
          >
            {String(count).padStart(2, "0")} PHOTOGRAPH{count === 1 ? "" : "S"}
          </div>
        </div>
        <div
          style={{
            paddingTop: "5mm",
            borderTop: "1px solid var(--hairline)",
            fontSize: "8.5pt",
            color: "var(--text-muted)",
          }}
        >
          {building}
        </div>
      </div>
    </section>
  );
}

/** Up to two photos per page; two portraits sit side-by-side, otherwise stacked. */
function PhotoSpread({ photos, phase }: { photos: PhotoView[]; phase: Phase }) {
  const bothPortrait = photos.length === 2 && photos.every((p) => p.height > p.width);
  if (bothPortrait) {
    return (
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: "6mm" }}>
        {photos.map((p) => (
          <PhotoCell key={p.id} photo={p} phase={phase} style={{ flex: 1 }} />
        ))}
      </div>
    );
  }
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "6mm" }}>
      {photos.map((p) => (
        <PhotoCell key={p.id} photo={p} phase={phase} style={{ flex: 1 }} />
      ))}
    </div>
  );
}

/** Comparison row: before-left / after-right. */
function ComparisonRow({ pair }: { pair: [PhotoView, PhotoView] }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", gap: "6mm" }}>
      <PhotoCell photo={pair[0]} phase="before" style={{ flex: 1 }} />
      <PhotoCell photo={pair[1]} phase="after" style={{ flex: 1 }} />
    </div>
  );
}

function ScopeBody({ r }: { r: ReportView }) {
  return (
    <div style={{ maxWidth: "150mm" }}>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "15pt",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          margin: "10mm 0 6mm",
        }}
      >
        Scope of works
      </h2>
      <p style={{ fontSize: "10.5pt", lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>{r.scope}</p>
      {r.preparedBy && (
        <p style={{ fontSize: "8.5pt", color: "var(--text-muted)", marginTop: "8mm" }}>
          Prepared by {r.preparedBy}
        </p>
      )}
    </div>
  );
}

function BackPage({ r, dark }: { r: ReportView; dark: boolean }) {
  return (
    <section className={`doc-page${dark ? " dark" : ""}`}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8mm",
          padding: "16mm",
          textAlign: "center",
        }}
      >
        <Logo logo={r.logo} heightMm={10} reversed={dark} />
        <div style={{ width: "18mm", borderTop: "1px solid var(--hairline)" }} />
        <div style={{ fontSize: "9.5pt", color: "var(--text-muted)", lineHeight: 1.8 }}>
          Thank you for choosing us for your cleaning &amp; restoration works.
          <br />
          Contact: hello@example.com · 020 0000 0000
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
            fontSize: "7pt",
            color: "var(--text-tertiary)",
          }}
        >
          {r.building.toUpperCase()} · {fmtDate(r.date)}
        </div>
      </div>
    </section>
  );
}

/**
 * The full document. Pagination is explicit: every child of this component is
 * exactly one A4 page, so PDF (print) and on-screen preview agree perfectly.
 */
export function ReportDocument({ r }: { r: ReportView }) {
  const dark = getTemplate(r.templateId).dark;
  const pages: React.ReactNode[] = [];
  let pageNo = 1; // cover is page 1; chrome starts on page 2

  pages.push(<Cover key="cover" r={r} />);

  const chrome = (key: string, children: React.ReactNode, contentStyle?: React.CSSProperties) => {
    pageNo += 1;
    pages.push(
      <ChromePage
        key={key}
        dark={dark}
        title={r.title}
        building={r.building}
        date={r.date}
        logo={r.logo}
        pageNo={pageNo}
        contentStyle={contentStyle}
      >
        {children}
      </ChromePage>,
    );
  };

  if (r.scope?.trim()) chrome("scope", <ScopeBody r={r} />);

  const paired =
    r.paired && r.photos.before.length > 0 && r.photos.before.length === r.photos.after.length;

  const addSection = (phase: Phase, heading: string, index: string, photos: PhotoView[]) => {
    if (photos.length === 0) return;
    pageNo += 1;
    pages.push(
      <Divider
        key={`div-${phase}-${index}`}
        dark={dark}
        index={index}
        heading={heading}
        count={photos.length}
        building={r.building}
      />,
    );
    chunk(photos, 2).forEach((group, i) =>
      chrome(`${phase}-${index}-${i}`, <PhotoSpread photos={group} phase={phase} />),
    );
  };

  if (paired) {
    // Before & after as aligned comparison rows; during keeps its own section.
    const pairs = r.photos.before.map((b, i) => [b, r.photos.after[i]] as [PhotoView, PhotoView]);
    pageNo += 1;
    pages.push(
      <Divider
        key="div-compare"
        dark={dark}
        index="01"
        heading="Before & after"
        count={pairs.length * 2}
        building={r.building}
      />,
    );
    chunk(pairs, 2).forEach((group, i) =>
      chrome(
        `compare-${i}`,
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "6mm" }}>
          {group.map((pair, j) => (
            <ComparisonRow key={j} pair={pair} />
          ))}
        </div>,
      ),
    );
    addSection("during", PHASE_TITLE.during, "02", r.photos.during);
  } else {
    for (const phase of PHASES) {
      addSection(phase, PHASE_TITLE[phase], SECTION_INDEX[phase], r.photos[phase]);
    }
  }

  pages.push(<BackPage key="back" r={r} dark={dark} />);

  return <>{pages}</>;
}
