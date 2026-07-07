import { NextResponse } from "next/server";
import { AUTH_COOKIE, createSessionToken } from "./auth";

/** JSON response that signs the user in via the session cookie. */
export async function sessionResponse(email: string) {
  const res = NextResponse.json({ ok: true, email });
  res.cookies.set(AUTH_COOKIE, await createSessionToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
