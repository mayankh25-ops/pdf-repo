import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Optional SMTP/Resend email send — stubbed behind an env flag (docs/SPEC.md).
 * The primary share path is the pre-filled mailto: link in the UI. To enable
 * real sending set EMAIL_SEND_ENABLED=1 and RESEND_API_KEY (plus EMAIL_FROM).
 */
export async function POST(req: NextRequest) {
  if (process.env.EMAIL_SEND_ENABLED !== "1") {
    return NextResponse.json(
      { error: "Email sending is not enabled on this deployment. Use the mailto link instead." },
      { status: 501 },
    );
  }
  const { to, subject, body } = await req.json();
  if (typeof to !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json({ error: "Invalid recipient address." }, { status: 400 });
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "reports@example.com",
      to: [to],
      subject: String(subject ?? "Cleaning works report").slice(0, 300),
      text: String(body ?? "").slice(0, 10_000),
    }),
  });
  if (!res.ok) {
    console.error("[send]", res.status, await res.text());
    return NextResponse.json({ error: "Email provider rejected the send." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
