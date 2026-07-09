import { NextRequest, NextResponse } from "next/server";
import { readOutput } from "@/lib/store";

export const runtime = "nodejs";

/** Branded page for dead links — these are opened from WhatsApp/email by
 *  clients, so a bare 404 string is not acceptable. */
const expiredPage = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Link expired — Cleaning Works Reports</title>
<style>
  body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;
    background:#F7F6F3;color:#1B1B1B;font-family:-apple-system,"Helvetica Neue",system-ui,sans-serif;padding:24px;box-sizing:border-box}
  .card{max-width:420px;background:#fff;border:1px solid #E9E6E0;border-radius:16px;padding:32px;text-align:center}
  .dot{width:44px;height:44px;border-radius:12px;background:#D9232E;color:#fff;font-size:22px;font-weight:800;
    display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
  h1{font-size:20px;margin:0 0 8px}
  p{font-size:15px;line-height:1.55;color:#6E6A63;margin:0}
</style>
</head>
<body>
  <div class="card">
    <div class="dot">F</div>
    <h1>This download link is no longer available</h1>
    <p>The file behind this link has been removed from the server.
    Please ask the sender for a fresh copy of the report — regenerating
    it takes under a minute.</p>
  </div>
</body>
</html>`;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await readOutput(token);
  if (!found) {
    return new NextResponse(expiredPage, {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  return new NextResponse(new Uint8Array(found.data), {
    headers: {
      "Content-Type": found.rec.mime,
      "Content-Disposition": `attachment; filename="${found.rec.filename.replace(/[^\w. -]/g, "_")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
