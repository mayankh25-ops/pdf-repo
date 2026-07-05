import { NextRequest, NextResponse } from "next/server";
import { readUpload } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await readUpload(id);
  if (!found) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(found.data), {
    headers: {
      "Content-Type": found.rec.mime,
      "Cache-Control": "private, max-age=86400",
      "Content-Security-Policy": "script-src 'none'", // uploaded SVGs stay inert
    },
  });
}
