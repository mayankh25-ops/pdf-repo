import { NextRequest, NextResponse } from "next/server";
import { getUser, newResetToken, saveUser } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Starts a password reset. If RESEND_API_KEY is configured the reset link is
 * emailed; otherwise the caller is told to contact the admin. Responses never
 * reveal whether an account exists.
 */
export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);
  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ ok: true, sent: emailConfigured });
  }

  const user = await getUser(email);
  if (user) {
    user.resetToken = newResetToken();
    user.resetExpires = Date.now() + 60 * 60 * 1000;
    await saveUser(user);

    if (emailConfigured) {
      const proto = req.headers.get("x-forwarded-proto") ?? "https";
      const host = req.headers.get("host") ?? "";
      const link = `${proto}://${host}/reset?email=${encodeURIComponent(user.email)}&token=${user.resetToken}`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ?? "reports@example.com",
          to: [user.email],
          subject: "Reset your report portal password",
          text: `Hi ${user.name},\n\nReset your password using this link (valid for 1 hour):\n${link}\n\nIf you didn't request this, you can ignore this email.`,
        }),
      });
      if (!res.ok) console.error("[forgot] email send failed", res.status);
    }
  }
  return NextResponse.json({ ok: true, sent: emailConfigured });
}
