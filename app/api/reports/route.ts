import { NextRequest, NextResponse } from "next/server";
import { listReports } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lists stored reports, optionally filtered by ?q= (number, title, building…). */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const reports = await listReports(q);
  return NextResponse.json({
    reports: reports.map((r) => ({
      ...r,
      pdfUrl: `/api/files/${r.pdfToken}`,
      docxUrl: `/api/files/${r.docxToken}`,
    })),
  });
}
