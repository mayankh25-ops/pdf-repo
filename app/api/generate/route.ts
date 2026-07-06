import { NextRequest, NextResponse } from "next/server";
import type { Phase, ReportData, TemplateId } from "@/lib/types";
import { renderPdf } from "@/lib/pdf";
import { renderDocx } from "@/lib/docx";
import { getProfile, nextReportNo, registerReport, saveJob, saveOutput } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 300;

const TEMPLATE_IDS: TemplateId[] = [
  "focused-photo",
  "focused-card",
  "focused-scrim",
  "hero-dark",
  "hero-light",
  "minimal-light",
  "minimal-dark",
  "editorial-split",
  "flow-dark",
  "quiet-caps",
  "accent-panel",
  "collage-card",
  "filmstrip",
];

const str = (v: unknown, max: number): string =>
  typeof v === "string" ? v.slice(0, max).trim() : "";

const photoList = (v: unknown): ReportData["photos"]["before"] =>
  Array.isArray(v)
    ? v
        .filter(
          (p) =>
            p &&
            typeof p.id === "string" &&
            /^[a-f0-9]{16,64}$|^sample:[\w.-]+$/.test(p.id) &&
            Number.isFinite(p.width) &&
            Number.isFinite(p.height),
        )
        .slice(0, 100)
        .map((p) => ({
          id: p.id,
          width: Math.round(p.width),
          height: Math.round(p.height),
          caption: str(p.caption, 140) || undefined,
        }))
    : [];

function sanitize(input: unknown): ReportData | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const title = str(raw.title, 160);
  const building = str(raw.building, 160);
  if (!title || !building) return null;
  const photos = raw.photos as Record<Phase, unknown> | undefined;
  const report: ReportData = {
    title,
    building,
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.date))
      ? String(raw.date)
      : new Date().toISOString().slice(0, 10),
    level: str(raw.level, 40) || undefined,
    area: str(raw.area, 80) || undefined,
    preparedBy: str(raw.preparedBy, 100) || undefined,
    scope: str(raw.scope, 4000) || undefined,
    remarks: str(raw.remarks, 4000) || undefined,
    templateId: TEMPLATE_IDS.includes(raw.templateId as TemplateId)
      ? (raw.templateId as TemplateId)
      : "focused-photo",
    paired: raw.paired === true,
    buildingPhoto: photoList([raw.buildingPhoto])[0] ?? null,
    logo: photoList([raw.logo])[0] ?? null,
    photos: {
      before: photoList(photos?.before),
      during: photoList(photos?.during),
      after: photoList(photos?.after),
      general: photoList(photos?.general),
    },
  };
  const totalPhotos =
    report.photos.before.length +
    report.photos.during.length +
    report.photos.after.length +
    report.photos.general.length;
  if (totalPhotos === 0) return null;
  return report;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "report";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const report = sanitize(body);
    if (!report) {
      return NextResponse.json(
        { error: "Report needs a title, a building name and at least one photo." },
        { status: 400 },
      );
    }

    // Resolve the selected company profile: brand name, accent and logo.
    const profile =
      (typeof body?.profileId === "string" ? await getProfile(body.profileId) : null) ??
      (await getProfile("focused-fm"));
    if (profile) {
      report.company = { name: profile.name, accent: profile.accent };
      report.logo = {
        id: profile.logoId,
        width: profile.logoWidth,
        height: profile.logoHeight,
      };
    }

    report.reportNo = await nextReportNo();
    const jobId = await saveJob(report);
    const proto = req.headers.get("x-forwarded-proto") ?? "http";
    const host = req.headers.get("host") ?? "localhost:3000";
    const origin = process.env.INTERNAL_ORIGIN || `${proto}://${host}`;

    const [pdf, docx] = await Promise.all([
      renderPdf(`${origin}/print/${jobId}`),
      renderDocx(report),
    ]);

    const base = `report-${report.reportNo}-${slug(report.building)}`;
    const pdfOut = await saveOutput(pdf, "pdf", "application/pdf", `${base}.pdf`, {
      persistent: true,
    });
    const docxOut = await saveOutput(
      docx,
      "docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      `${base}.docx`,
      { persistent: true },
    );

    await registerReport({
      reportNo: report.reportNo,
      title: report.title,
      building: report.building,
      date: report.date,
      preparedBy: report.preparedBy,
      templateId: report.templateId,
      createdAt: new Date().toISOString(),
      pdfToken: pdfOut.token,
      docxToken: docxOut.token,
    });

    return NextResponse.json({
      reportNo: report.reportNo,
      pdfUrl: `/api/files/${pdfOut.token}`,
      docxUrl: `/api/files/${docxOut.token}`,
      pdfBytes: pdf.length,
    });
  } catch (err) {
    console.error("[generate]", err);
    return NextResponse.json(
      { error: "Report generation failed. Check the server logs (is Chromium available?)." },
      { status: 500 },
    );
  }
}
