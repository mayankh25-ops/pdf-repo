import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  PageNumber,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  convertMillimetersToTwip,
} from "docx";
import sharp from "sharp";
import type { Phase } from "./types";
import { PHASES, PHASE_LABEL, PHASE_TITLE } from "./types";
import type { PhotoMeta, ReportData } from "./types";
import { readUpload } from "./store";

/*
 * Word export mirrors the PDF structure — cover, running header/footer,
 * optional scope, tagged photo sections, back page — but stays deliberately
 * simple so it opens cleanly in MS Word and Google Docs (docs/SPEC.md quality
 * bar). Colours reference the same sand scale values as design/tokens.md.
 */
const TOKENS = {
  text: "21201C", // sand-12
  muted: "63635E", // sand-11
  hairline: "DAD9D6", // sand-6
};

const DISPLAY = "General Sans";
const BODY = "Hanken Grotesk";
const MONO = "Geist Mono";

const CONTENT_WIDTH_PX = 660; // A4 minus 16mm margins at 96dpi
const MAX_IMG_HEIGHT_PX = 620;

interface LoadedPhoto extends PhotoMeta {
  data: Buffer;
}

const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
};

const mono = (text: string, size = 14, color = TOKENS.muted) =>
  new TextRun({ text, font: MONO, size, color, characterSpacing: 20 });

const hairlineBorder = {
  bottom: { style: BorderStyle.SINGLE, size: 4, color: TOKENS.hairline },
};

async function loadPhoto(p: PhotoMeta): Promise<LoadedPhoto | null> {
  const found = await readUpload(p.id);
  if (!found) return null;
  return { ...p, data: found.data };
}

function fitImage(p: PhotoMeta, maxW = CONTENT_WIDTH_PX, maxH = MAX_IMG_HEIGHT_PX) {
  const scale = Math.min(maxW / p.width, maxH / p.height, 1);
  return { width: Math.round(p.width * scale), height: Math.round(p.height * scale) };
}

function photoBlock(photo: LoadedPhoto, phase: Phase, maxW?: number): Paragraph[] {
  const { width, height } = fitImage(photo, maxW);
  return [
    new Paragraph({
      spacing: { before: 240, after: 60 },
      children: [mono(PHASE_LABEL[phase], 13)],
    }),
    new Paragraph({
      children: [
        new ImageRun({ type: "jpg", data: photo.data, transformation: { width, height } }),
      ],
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({ text: photo.caption ?? "", font: BODY, size: 17, color: TOKENS.muted }),
      ],
    }),
  ];
}

function comparisonRow(before: LoadedPhoto, after: LoadedPhoto): TableRow {
  const cell = (photo: LoadedPhoto, phase: Phase) =>
    new TableCell({
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      margins: { top: 100, bottom: 100, left: 0, right: 140 },
      children: photoBlock(photo, phase, 310),
    });
  return new TableRow({ children: [cell(before, "before"), cell(after, "after")] });
}

export async function renderDocx(report: ReportData): Promise<Buffer> {
  // Load all assets up front.
  const photos: Record<Phase, LoadedPhoto[]> = { before: [], during: [], after: [] };
  for (const phase of PHASES) {
    for (const p of report.photos[phase]) {
      const loaded = await loadPhoto(p);
      if (loaded) photos[phase].push(loaded);
    }
  }

  let logoPng: Buffer | null = null;
  let logoDims = { width: 120, height: 33 };
  if (report.logo) {
    const found = await readUpload(report.logo.id);
    if (found) {
      // Word can't be trusted with SVG everywhere — rasterise to PNG.
      logoPng =
        found.rec.mime === "image/svg+xml"
          ? await sharp(found.data, { density: 300 }).resize({ width: 480 }).png().toBuffer()
          : found.data;
      const meta = await sharp(logoPng).metadata();
      if (meta.width && meta.height) {
        const scale = Math.min(140 / meta.width, 42 / meta.height, 1);
        logoDims = {
          width: Math.round(meta.width * scale),
          height: Math.round(meta.height * scale),
        };
      }
    }
  }

  let buildingPhoto: LoadedPhoto | null = null;
  if (report.buildingPhoto) buildingPhoto = await loadPhoto(report.buildingPhoto);

  const logoRun = () =>
    logoPng
      ? [new ImageRun({ type: "png", data: logoPng, transformation: logoDims })]
      : [new TextRun({ text: "" })];

  const pageMargins = {
    top: convertMillimetersToTwip(18),
    bottom: convertMillimetersToTwip(18),
    left: convertMillimetersToTwip(16),
    right: convertMillimetersToTwip(16),
  };

  // --- Cover ---------------------------------------------------------------
  const coverChildren: Paragraph[] = [
    new Paragraph({ spacing: { after: 1200 }, children: logoRun() }),
    new Paragraph({
      spacing: { after: 2400 },
      children: [mono("CLEANING WORKS REPORT")],
      border: hairlineBorder,
    }),
    new Paragraph({
      spacing: { after: 300 },
      children: [
        mono(fmtDate(report.date)),
        ...(report.reportNo ? [mono(`  ·  REPORT Nº ${report.reportNo}`)] : []),
      ],
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: report.title,
          font: DISPLAY,
          size: 72,
          bold: true,
          color: TOKENS.text,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 2000 },
      children: [
        new TextRun({ text: report.building, font: BODY, size: 28, color: TOKENS.muted }),
      ],
    }),
  ];
  if (buildingPhoto) {
    coverChildren.push(
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new ImageRun({
            type: "jpg",
            data: buildingPhoto.data,
            transformation: fitImage(buildingPhoto, CONTENT_WIDTH_PX, 380),
          }),
        ],
      }),
    );
  }
  if (report.preparedBy) {
    coverChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Prepared by ${report.preparedBy}`,
            font: BODY,
            size: 18,
            color: TOKENS.muted,
          }),
        ],
      }),
    );
  }

  // --- Body ----------------------------------------------------------------
  const body: (Paragraph | Table)[] = [];

  const sectionHeading = (index: string, title: string, count: number, first = false) => {
    body.push(
      new Paragraph({
        pageBreakBefore: !first,
        spacing: { after: 120 },
        children: [mono(`SECTION ${index}`)],
      }),
      new Paragraph({
        spacing: { after: 120 },
        border: hairlineBorder,
        children: [
          new TextRun({ text: title, font: DISPLAY, size: 48, bold: true, color: TOKENS.text }),
        ],
      }),
      new Paragraph({
        spacing: { after: 240 },
        children: [mono(`${String(count).padStart(2, "0")} PHOTOGRAPHS`)],
      }),
    );
  };

  let firstBlock = true;
  if (report.scope?.trim()) {
    body.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: "Scope of works",
            font: DISPLAY,
            size: 30,
            bold: true,
            color: TOKENS.text,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 240, line: 340 },
        children: [
          new TextRun({ text: report.scope.trim(), font: BODY, size: 21, color: TOKENS.text }),
        ],
      }),
    );
    firstBlock = false;
  }

  const paired =
    report.paired && photos.before.length > 0 && photos.before.length === photos.after.length;

  if (paired) {
    sectionHeading("01", "Before & after", photos.before.length * 2, firstBlock);
    body.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },
        rows: photos.before.map((b, i) => comparisonRow(b, photos.after[i])),
      }),
    );
    if (photos.during.length) {
      sectionHeading("02", PHASE_TITLE.during, photos.during.length);
      for (const p of photos.during) body.push(...photoBlock(p, "during"));
    }
  } else {
    const idx: Record<Phase, string> = { before: "01", during: "02", after: "03" };
    for (const phase of PHASES) {
      if (!photos[phase].length) continue;
      sectionHeading(idx[phase], PHASE_TITLE[phase], photos[phase].length, firstBlock);
      firstBlock = false;
      for (const p of photos[phase]) body.push(...photoBlock(p, phase));
    }
  }

  // Back page — logo, optional remarks (only when provided), meta line.
  body.push(
    new Paragraph({
      pageBreakBefore: true,
      spacing: { before: 4800, after: 400 },
      alignment: AlignmentType.CENTER,
      children: logoRun(),
    }),
  );
  if (report.remarks?.trim()) {
    body.push(
      new Paragraph({ spacing: { after: 120 }, children: [mono("REMARKS", 14)] }),
      new Paragraph({
        spacing: { after: 400, line: 320 },
        children: [
          new TextRun({ text: report.remarks.trim(), font: BODY, size: 20, color: TOKENS.text }),
        ],
      }),
    );
  }
  body.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        mono(
          `${report.reportNo ? `REPORT Nº ${report.reportNo} · ` : ""}${report.building.toUpperCase()} · ${fmtDate(report.date)}`,
          13,
        ),
      ],
    }),
  );

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: BODY, size: 21, color: TOKENS.text } },
      },
    },
    sections: [
      {
        properties: { page: { margin: pageMargins } },
        children: coverChildren,
      },
      {
        properties: { page: { margin: pageMargins } },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                border: hairlineBorder,
                tabStops: [{ type: "right", position: convertMillimetersToTwip(178) }],
                children: [
                  new TextRun({ text: report.title, font: BODY, size: 16, color: TOKENS.muted }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: TOKENS.hairline },
                },
                tabStops: [{ type: "right", position: convertMillimetersToTwip(178) }],
                children: [
                  mono(report.building.toUpperCase(), 13),
                  new TextRun({ text: "\t", font: MONO, size: 13 }),
                  mono(
                    `${report.reportNo ? `Nº ${report.reportNo} · ` : ""}${fmtDate(report.date)} · `,
                    13,
                  ),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: MONO,
                    size: 13,
                    color: TOKENS.muted,
                  }),
                ],
              }),
            ],
          }),
        },
        children: body,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
