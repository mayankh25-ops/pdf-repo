import { NextRequest, NextResponse } from "next/server";
import { ADMIN_EMAIL, AUTH_COOKIE, verifySessionToken } from "@/lib/auth";
import { listUsers, setUserStatus } from "@/lib/store";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isAdmin = async (req: NextRequest) =>
  (await verifySessionToken(req.cookies.get(AUTH_COOKIE)?.value)) === ADMIN_EMAIL();

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Only the admin can manage users." }, { status: 403 });
  }
  return NextResponse.json({
    users: (await listUsers()).map((u) => ({
      email: u.email,
      name: u.name,
      status: u.status ?? "active",
      createdAt: u.createdAt,
    })),
  });
}

/** Body: { email, action: "approve" | "reject" } */
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Only the admin can manage users." }, { status: 403 });
  }
  const { email, action } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const user = await setUserStatus(
    email.trim().toLowerCase(),
    action === "approve" ? "active" : "rejected",
  );
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (action === "approve") {
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const host = req.headers.get("host") ?? "";
    await sendEmail(
      user.email,
      "Your report portal account is approved",
      `Hi ${user.name},\n\nYour account has been approved. Sign in here:\n${proto}://${host}/login\n\nCleaning Works Reports`,
    );
  }
  return NextResponse.json({ ok: true, status: user.status });
}
