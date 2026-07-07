import { NextRequest, NextResponse } from "next/server";
import { ADMIN_EMAIL, hashPassword } from "@/lib/auth";
import { getUser, newSalt, saveUser } from "@/lib/store";
import { sessionResponse } from "@/lib/session";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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
  await saveUser({
    email: normalised,
    name: name.trim().slice(0, 120),
    salt,
    passHash: await hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  });
  return sessionResponse(normalised);
}
