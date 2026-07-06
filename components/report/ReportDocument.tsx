import type { Phase } from "@/lib/types";
import { PHASES, PHASE_TITLE } from "@/lib/types";
import { getTemplate } from "@/lib/templates";
import type { PhotoView, ReportView } from "@/lib/sample";
import { ChromePage, Logo, PhotoCell, fmtDate } from "./primitives";
import { Cover } from "./covers";
import {
  FocusedCover,
  FocusedHeading,
  FocusedPage,
  FocusedPhotoBlock,
  FocusedScope,
  FocusedThankYou,
} from "./focused";

/* Content column inside a ChromePage: 210−32 wide, ~240mm usable height. */
const CONTENT_W = 178;
const CONTENT_H = 240;
const GAP = 6;

const SECTION_INDEX: Record<Phase, string> = { before: "01", during: "02", after: "03", general: "04" };

const isPortrait = (p: PhotoView) => p.height >= p.width;

type SpreadKind = "single" | "portrait-pair" | "landscape-pair";
interface Spread {
  kind: SpreadKind;
  photos: PhotoView[];
}

/**
 * Groups photos into pages without ever distorting or cropping them:
 * two portraits sit side-by-side, two landscapes stack, and a mixed or
 * leftover photo gets a full page to itself. Order is preserved.
 */
function paginate(photos: PhotoView[]): Spread[] {
  const spreads: Spread[] = [];
  let i = 0;
  while (i < photos.length) {
    const a = photos[i];
    const b = photos[i + 1];
    if (b && isPortrait(a) && isPortrait(b)) {
      spreads.push({ kind: "portrait-pair", photos: [a, b] });
      i += 2;
    } else if (b && !isPortrait(a) && !isPortrait(b)) {
      spreads.push({ kind: "landscape-pair", photos: [a, b] });
      i += 2;
    } else {
      spreads.push({ kind: "single", photos: [a] });
      i += 1;
    }
  }
  return spreads;
}

function SpreadBlock({ spread, phase }: { spread: Spread; phase: Phase }) {
  if (spread.kind === "portrait-pair") {
    const boxW = (CONTENT_W - GAP) / 2;
    return (
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: `${GAP}mm`, alignItems: "center" }}>
        {spread.photos.map((p) => (
          <PhotoCell key={p.id} photo={p} phase={phase} boxW={boxW} boxH={CONTENT_H - 14} style={{ flex: 1 }} />
        ))}
      </div>
    );
  }
  if (spread.kind === "landscape-pair") {
    const boxH = (CONTENT_H - GAP - 20) / 2;
    return (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: `${GAP}mm`,
          justifyContent: "center",
        }}
      >
        {spread.photos.map((p) => (
          <PhotoCell key={p.id} photo={p} phase={phase} boxW={CONTENT_W} boxH={boxH} style={{ flex: 1 }} />
        ))}
      </div>
    );
  }
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <PhotoCell photo={spread.photos[0]} phase={phase} boxW={CONTENT_W} boxH={CONTENT_H - 16} />
    </div>
  );
}

/** Comparison row: before-left / after-right, aspect ratios preserved. */
function ComparisonRow({ pair }: { pair: [PhotoView, PhotoView] }) {
  const boxW = (CONTENT_W - GAP) / 2;
  const boxH = (CONTENT_H - GAP) / 2 - 14;
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", gap: `${GAP}mm`, alignItems: "center" }}>
      <PhotoCell photo={pair[0]} phase="before" boxW={boxW} boxH={boxH} style={{ flex: 1 }} />
      <PhotoCell photo={pair[1]} phase="after" boxW={boxW} boxH={boxH} style={{ flex: 1 }} />
    </div>
  );
}

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

/**
 * Back page: logo, optional remarks (only when the user filled them in) and
 * the report meta line. No boilerplate copy.
 */
function BackPage({ r, dark }: { r: ReportView; dark: boolean }) {
  const remarks = r.remarks?.trim();
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
        }}
      >
        <Logo logo={r.logo} heightMm={10} reversed={dark} />
        <div style={{ width: "18mm", borderTop: "1px solid var(--hairline)" }} />
        {remarks ? (
          <div style={{ maxWidth: "130mm", textAlign: "left" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.12em",
                fontSize: "7.5pt",
                fontWeight: 500,
                color: "var(--text-muted)",
                marginBottom: "3mm",
              }}
            >
              REMARKS
            </div>
            <p style={{ fontSize: "10pt", lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>{remarks}</p>
          </div>
        ) : null}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
            fontSize: "7pt",
            color: "var(--text-tertiary)",
            textAlign: "center",
          }}
        >
          {r.reportNo ? `REPORT Nº ${r.reportNo} · ` : ""}
          {r.building.toUpperCase()} · {fmtDate(r.date)}
        </div>
      </div>
    </section>
  );
}

/** The document's final page — used directly by the template picker preview. */
export function DocumentLastPage({ r }: { r: ReportView }) {
  if (getTemplate(r.templateId).family === "focused") return <FocusedThankYou r={r} />;
  return <BackPage r={r} dark={getTemplate(r.templateId).dark} />;
}

const FOCUSED_IDX: Record<Phase, string> = { before: "01", during: "02", after: "03", general: "04" };

/** The client's own family: one large photo per page, heading inline on the
 *  first page of each section, Thank-you last page. */
function buildFocusedPages(r: ReportView): React.ReactNode[] {
  const pages: React.ReactNode[] = [<FocusedCover key="cover" r={r} />];
  if (r.scope?.trim()) pages.push(<FocusedScope key="scope" r={r} />);

  const paired =
    r.paired && r.photos.before.length > 0 && r.photos.before.length === r.photos.after.length;

  if (paired) {
    r.photos.before.forEach((b, i) => {
      const a = r.photos.after[i];
      pages.push(
        <FocusedPage key={`pair-${i}`} r={r}>
          {i === 0 && <FocusedHeading index="01" title="Before & after" />}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly", minHeight: 0 }}>
            <FocusedPhotoBlock photo={b} phase="before" boxH={i === 0 ? 86 : 92} />
            <FocusedPhotoBlock photo={a} phase="after" boxH={i === 0 ? 86 : 92} />
          </div>
        </FocusedPage>,
      );
    });
    r.photos.during.forEach((photo, i) => {
      pages.push(
        <FocusedPage key={`during-${i}`} r={r}>
          {i === 0 && <FocusedHeading index="02" title={PHASE_TITLE.during} />}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 0 }}>
            <FocusedPhotoBlock photo={photo} phase="during" boxH={i === 0 ? 185 : 200} />
          </div>
        </FocusedPage>,
      );
    });
    r.photos.general.forEach((photo, i) => {
      pages.push(
        <FocusedPage key={`general-${i}`} r={r}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 0 }}>
            <FocusedPhotoBlock photo={photo} phase="general" boxH={200} />
          </div>
        </FocusedPage>,
      );
    });
  } else {
    for (const phase of PHASES) {
      r.photos[phase].forEach((photo, i) => {
        pages.push(
          <FocusedPage key={`${phase}-${i}`} r={r}>
            {i === 0 && PHASE_TITLE[phase] !== "" && (
              <FocusedHeading index={FOCUSED_IDX[phase]} title={PHASE_TITLE[phase]} />
            )}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 0 }}>
              <FocusedPhotoBlock photo={photo} phase={phase} boxH={i === 0 ? 185 : 200} />
            </div>
          </FocusedPage>,
        );
      });
    }
  }

  pages.push(<FocusedThankYou key="thanks" r={r} />);
  return pages;
}

/** All pages of the document, in order, as separate nodes. */
export function buildDocumentPages(r: ReportView): React.ReactNode[] {
  return getTemplate(r.templateId).family === "focused"
    ? buildFocusedPages(r)
    : buildStandardPages(r);
}

/**
 * Cascades the company brand accent (from the selected profile) to any
 * document page rendered inside. display:contents keeps pages as direct
 * layout children so print pagination is unaffected.
 */
export function DocAccent({ r, children }: { r: ReportView; children: React.ReactNode }) {
  const accentStyle = r.company?.accent
    ? ({ "--accent": r.company.accent, "--accent-contrast": "#ffffff" } as React.CSSProperties)
    : undefined;
  return <div style={{ display: "contents", ...accentStyle }}>{children}</div>;
}

/**
 * The full document. Pagination is explicit: every page is exactly one A4
 * .doc-page, so PDF (print) and on-screen preview agree perfectly.
 */
export function ReportDocument({ r }: { r: ReportView }) {
  return <DocAccent r={r}>{buildDocumentPages(r)}</DocAccent>;
}

function buildStandardPages(r: ReportView): React.ReactNode[] {
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
        reportNo={r.reportNo}
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
    if (heading) {
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
    }
    paginate(photos).forEach((spread, i) =>
      chrome(`${phase}-${index}-${i}`, <SpreadBlock spread={spread} phase={phase} />),
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
    for (let i = 0; i < pairs.length; i += 2) {
      const group = pairs.slice(i, i + 2);
      chrome(
        `compare-${i}`,
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            gap: `${GAP}mm`,
            justifyContent: "center",
          }}
        >
          {group.map((pair, j) => (
            <ComparisonRow key={j} pair={pair} />
          ))}
        </div>,
      );
    }
    addSection("during", PHASE_TITLE.during, "02", r.photos.during);
    addSection("general", "", "04", r.photos.general);
  } else {
    for (const phase of PHASES) {
      addSection(phase, PHASE_TITLE[phase], SECTION_INDEX[phase], r.photos[phase]);
    }
  }

  pages.push(<BackPage key="back" r={r} dark={dark} />);

  return pages;
}
