import { NextRequest, NextResponse } from "next/server";
import { readOutput } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await readOutput(token);
  if (!found) {
    return new NextResponse("This download link has expired or does not exist.", { status: 404 });
  }
  return new NextResponse(new Uint8Array(found.data), {
    headers: {
      "Content-Type": found.rec.mime,
      "Content-Disposition": `attachment; filename="${found.rec.filename.replace(/[^\w. -]/g, "_")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
