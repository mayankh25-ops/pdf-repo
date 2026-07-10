import { NextRequest, NextResponse } from "next/server";
import { ADMIN_EMAIL, approvalToken, hashPassword } from "@/lib/auth";
import { getUser, newSalt, saveUser } from "@/lib/store";
import { adminNotifyEmail, sendEmail } from "@/lib/email";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Account requests. New users are stored as "pending" and cannot sign in
 * until the admin approves them — the admin gets an email with one-click
 * approve / reject links (plus the /admin page in the portal).
 */
export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json().catch(() => ({}));
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }
  const normalised = email.trim().toLowerCase();
  if (normalised === ADMIN_EMAIL().toLowerCase() || (await getUser(normalised))) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }
  const salt = newSalt();
  const cleanName = name.trim().slice(0, 120);
  await saveUser({
    email: normalised,
    name: cleanName,
    salt,
    passHash: await hashPassword(password, salt),
    createdAt: new Date().toISOString(),
    status: "pending",
  });

  // Notify the admin with one-click approval links (best-effort).
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "";
  const origin = `${proto}://${host}`;
  const link = async (action: "approve" | "reject") =>
    `${origin}/api/approve?email=${encodeURIComponent(normalised)}&action=${action}&token=${await approvalToken(normalised, action)}`;
  await sendEmail(
    adminNotifyEmail(),
    `Account request — ${cleanName}`,
    `${cleanName} (${normalised}) requested access to the Cleaning Works report portal.\n\n` +
      `Approve: ${await link("approve")}\n\n` +
      `Reject: ${await link("reject")}\n\n` +
      `You can also manage users at ${origin}/admin`,
  );

  return NextResponse.json({ ok: true, pending: true });
}
