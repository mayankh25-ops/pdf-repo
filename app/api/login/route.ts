import { NextRequest, NextResponse } from "next/server";
import { ADMIN_EMAIL, hashPassword, isAdminCredentials } from "@/lib/auth";
import { sessionResponse } from "@/lib/session";
import { getUser } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}));
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }
  if (isAdminCredentials(username, password)) {
    return sessionResponse(ADMIN_EMAIL());
  }
  const user = await getUser(username);
  if (user && (await hashPassword(password, user.salt)) === user.passHash) {
    const status = user.status ?? "active";
    if (status === "pending") {
      return NextResponse.json(
        { error: "Your account is awaiting admin approval — you'll be able to sign in once it's verified." },
        { status: 403 },
      );
    }
    if (status === "rejected") {
      return NextResponse.json(
        { error: "This account hasn't been approved. Contact the admin if you think this is a mistake." },
        { status: 403 },
      );
    }
    return sessionResponse(user.email);
  }
  return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
}
