import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { getUser, newSalt, saveUser } from "@/lib/store";
import { sessionResponse } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, token, password } = await req.json().catch(() => ({}));
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }
  const user = typeof email === "string" ? await getUser(email) : null;
  if (
    !user ||
    typeof token !== "string" ||
    !user.resetToken ||
    user.resetToken !== token ||
    !user.resetExpires ||
    Date.now() > user.resetExpires
  ) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired — request a new one." },
      { status: 400 },
    );
  }
  user.salt = newSalt();
  user.passHash = await hashPassword(password, user.salt);
  delete user.resetToken;
  delete user.resetExpires;
  await saveUser(user);
  return sessionResponse(user.email);
}
