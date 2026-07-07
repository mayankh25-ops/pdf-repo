import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";
import { listReports } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lists stored reports, optionally filtered by ?q= (number, title, building…). */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  let reports = await listReports(q);
  if (req.nextUrl.searchParams.get("mine") === "1") {
    const email = await verifySessionToken(req.cookies.get(AUTH_COOKIE)?.value);
    reports = reports.filter((r) => r.createdBy && r.createdBy === email);
  }
  return NextResponse.json({
    reports: reports.map((r) => ({
      ...r,
      pdfUrl: `/api/files/${r.pdfToken}`,
      docxUrl: `/api/files/${r.docxToken}`,
    })),
  });
}
