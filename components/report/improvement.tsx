import type { Phase } from "@/lib/types";
import { PHASE_LABEL } from "@/lib/types";
import type { PhotoView, ReportView } from "@/lib/sample";
import { photoPageChunksSized } from "@/lib/layout";
import { fitBox } from "./primitives";

/* ---------------------------------------------------------------------------
   "Improvement Report" family — replicates the Aurora × FFM weekly
   improvement reports: PT Sans, deep navy headings (#073763), a co-branded
   header (building lockup left, company logo right), a Report Date /
   Prepared By / Subject meta table, typed sections (Current Situation →
   Rectifications Completed → Recommendations), big stretched photos with
   captions, and a solid navy footer bar on every page.
--------------------------------------------------------------------------- */

const NAVY = "#073763";
const BAR = "#131c33";
const PT = `"PT Sans", "Hanken Grotesk", ui-sans-serif, system-ui, sans-serif`;
const CONTENT_W = 182; // 210 − 2×14mm margins

const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
};

function Img({ url, style }: { url: string; style?: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }}
    />
  );
}

/** Every page: co-branded header + navy footer bar. */
export function ImprovementPage({ r, children }: { r: ReportView; children: React.ReactNode }) {
  return (
    <section className="doc-page" style={{ fontFamily: PT }}>
      <header
        style={{
          margin: "0 14mm",
          height: "22mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `0.6mm solid ${NAVY}`,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "15pt",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: NAVY,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "110mm",
            }}
          >
            {r.building}
          </div>
          <div
            style={{
              fontSize: "7pt",
              fontWeight: 700,
              letterSpacing: "0.3em",
              color: NAVY,
              opacity: 0.75,
              marginTop: "1mm",
            }}
          >
            IMPROVEMENT REPORT
          </div>
        </div>
        {r.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.logo.url}
            alt=""
            style={{
              height: "calc(10mm * var(--logo-scale, 1))",
              maxHeight: "16mm",
              width: "auto",
              maxWidth: "48mm",
              objectFit: "contain",
            }}
          />
        )}
      </header>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: "6mm 14mm",
          display: "flex",
          flexDirection: "column",
          color: "#1b1b1b",
        }}
      >
        {children}
      </div>

      <footer
        style={{
          height: "14mm",
          background: BAR,
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1mm",
        }}
      >
        <div style={{ fontSize: "8pt", fontWeight: 700, letterSpacing: "0.1em" }}>
          {(r.company?.name ?? "").toUpperCase()}
        </div>
        <div
          style={{
            fontSize: "7pt",
            opacity: 0.85,
            maxWidth: "160mm",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {r.title.toUpperCase()} · {fmtDate(r.date).toUpperCase()}
          {r.preparedBy ? ` · PREPARED BY ${r.preparedBy.toUpperCase()}` : ""}
        </div>
      </footer>
    </section>
  );
}

/** Navy section heading, e.g. "Current Situation". */
export function ImprovementHeading({ title }: { title: string }) {
  return (
    <h2
      style={{
        fontSize: "16pt",
        fontWeight: 700,
        color: NAVY,
        margin: "0 0 3.5mm",
      }}
    >
      {title}
    </h2>
  );
}

/** Body text — user-typed; blank lines separate paragraphs. */
export function ImprovementText({ text }: { text: string }) {
  return (
    <p
      style={{
        fontSize: "11pt",
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
        margin: "0 0 6mm",
        color: "#222222",
      }}
    >
      {text.trim()}
    </p>
  );
}

/** Cover / first page: meta table, big title, current situation. */
export function ImprovementCover({ r }: { r: ReportView }) {
  const rows: [string, string][] = [
    ["Report Date", fmtDate(r.date)],
    ...(r.preparedBy ? ([["Prepared By", r.preparedBy]] as [string, string][]) : []),
    [
      "Subject",
      [r.level && `Level ${r.level}`, r.area, r.building].filter(Boolean).join(" – "),
    ],
  ];
  const situation = r.currentSituation?.trim();
  return (
    <ImprovementPage r={r}>
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          marginBottom: "7mm",
        }}
      >
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td
                style={{
                  width: "42mm",
                  padding: "2.6mm 0",
                  fontSize: "12pt",
                  fontWeight: 700,
                  color: NAVY,
                  borderBottom: "1px solid #d8d8d8",
                  verticalAlign: "top",
                }}
              >
                {label}
              </td>
              <td
                style={{
                  padding: "2.6mm 0",
                  fontSize: "12pt",
                  color: NAVY,
                  borderBottom: "1px solid #d8d8d8",
                }}
              >
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h1
        style={{
          fontSize: "18pt",
          fontWeight: 700,
          color: NAVY,
          lineHeight: 1.25,
          margin: "0 0 7mm",
        }}
      >
        {r.title}
      </h1>

      {situation ? (
        <>
          <ImprovementHeading title="Current Situation" />
          <ImprovementText text={situation} />
        </>
      ) : null}

      {/* Building photo fills the rest of the first page. */}
      {r.buildingPhoto && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            borderRadius: "2mm",
            overflow: "hidden",
            background: "#eeeeee",
          }}
        >
          <Img url={r.buildingPhoto.url} />
        </div>
      )}
    </ImprovementPage>
  );
}

const pill = (phase: Phase): React.ReactNode =>
  PHASE_LABEL[phase] ? (
    <span
      style={{
        display: "inline-block",
        fontSize: "7pt",
        fontWeight: 700,
        letterSpacing: "0.1em",
        color: "#ffffff",
        background: NAVY,
        padding: "1.4mm 3mm",
        borderRadius: "1.2mm",
        lineHeight: 1,
      }}
    >
      {PHASE_LABEL[phase]}
    </span>
  ) : null;

/** One large photo, stretched to the content area, caption + pill beneath. */
export function ImprovementBig({
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: `${w}mm`, height: `${h}mm`, borderRadius: "2mm", overflow: "hidden" }}>
        <Img url={photo.url} />
      </div>
      {(PHASE_LABEL[phase] || photo.caption) && (
        <div
          style={{
            alignSelf: "stretch",
            display: "flex",
            alignItems: "center",
            gap: "3mm",
            marginTop: "3mm",
          }}
        >
          {pill(phase)}
          {photo.caption && (
            <span style={{ fontSize: "10pt", color: "#444444" }}>{photo.caption}</span>
          )}
        </div>
      )}
    </div>
  );
}

/** 2×2 (or fewer) grid page — uniform cells, pill + caption chip overlaid. */
export function ImprovementGrid({ photos, phase }: { photos: PhotoView[]; phase: Phase }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: photos.length > 2 ? "1fr 1fr" : "1fr",
        gap: "5mm",
      }}
    >
      {photos.map((p) => (
        <div
          key={p.id}
          style={{
            position: "relative",
            borderRadius: "2mm",
            overflow: "hidden",
            background: "#eeeeee",
            minHeight: 0,
          }}
        >
          <Img url={p.url} style={{ position: "absolute", inset: 0, height: "100%" }} />
          {(PHASE_LABEL[phase] || p.caption) && (
            <div
              style={{
                position: "absolute",
                left: "4mm",
                right: "4mm",
                bottom: "4mm",
                display: "flex",
                alignItems: "center",
                gap: "2.5mm",
              }}
            >
              {pill(phase)}
              {p.caption && (
                <span
                  style={{
                    fontSize: "8pt",
                    color: "#ffffff",
                    background: "rgba(10,16,32,0.6)",
                    padding: "1.5mm 3mm",
                    borderRadius: "1.2mm",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.caption}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Small navy zone label above the first photo page of a tagged phase. */
export function ImprovementPhaseLabel({ phase }: { phase: Phase }) {
  if (!PHASE_LABEL[phase]) return null;
  return (
    <div
      style={{
        fontSize: "10pt",
        fontWeight: 700,
        letterSpacing: "0.14em",
        color: NAVY,
        marginBottom: "3.5mm",
      }}
    >
      {PHASE_LABEL[phase]}
    </div>
  );
}

/** Closing page: Rectifications Completed + Recommendations (+ remarks). */
export function ImprovementClosing({ r }: { r: ReportView }) {
  const rect = r.rectifications?.trim();
  const rec = r.recommendations?.trim();
  const remarks = r.remarks?.trim();
  return (
    <ImprovementPage r={r}>
      {rect ? (
        <>
          <ImprovementHeading title="Rectifications Completed" />
          <ImprovementText text={rect} />
        </>
      ) : null}
      {rec ? (
        <>
          <ImprovementHeading title="Recommendations" />
          <ImprovementText text={rec} />
        </>
      ) : null}
      {remarks ? (
        <>
          <ImprovementHeading title="Remarks" />
          <ImprovementText text={remarks} />
        </>
      ) : null}
    </ImprovementPage>
  );
}

/** All pages of the improvement report, in order. */
export function buildImprovementPages(r: ReportView): React.ReactNode[] {
  const pages: React.ReactNode[] = [<ImprovementCover key="cover" r={r} />];

  const phases: Phase[] = ["before", "during", "after", "general"];
  for (const phase of phases) {
    const list = r.photos[phase];
    photoPageChunksSized(list.map((p) => p.size)).forEach((chunk, ci) => {
      const group = list.slice(chunk.start, chunk.start + chunk.count);
      const labelled = ci === 0 && PHASE_LABEL[phase] !== "";
      pages.push(
        <ImprovementPage key={`${phase}-${ci}`} r={r}>
          {labelled && <ImprovementPhaseLabel phase={phase} />}
          {chunk.kind === "grid" ? (
            <ImprovementGrid photos={group} phase={phase} />
          ) : chunk.kind === "duo" ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-evenly",
                minHeight: 0,
              }}
            >
              {group.map((photo) => (
                <ImprovementBig key={photo.id} photo={photo} phase={phase} boxH={labelled ? 88 : 92} />
              ))}
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: 0,
              }}
            >
              <ImprovementBig photo={group[0]} phase={phase} boxH={labelled ? 190 : 200} />
            </div>
          )}
        </ImprovementPage>,
      );
    });
  }

  if (r.rectifications?.trim() || r.recommendations?.trim() || r.remarks?.trim()) {
    pages.push(<ImprovementClosing key="closing" r={r} />);
  }
  return pages;
}
