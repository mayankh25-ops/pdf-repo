import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Gates the portal behind the admin login. Left open:
 *  - /login + /api/login (the gate itself)
 *  - /print/<jobId> + /api/images/<id> (headless Chromium renders PDFs
 *    server-side without cookies; ids are unguessable 20-hex tokens)
 *  - /api/files/<token> (share links sent via WhatsApp/email must work)
 *  - static assets (_next, fonts, brand, samples)
 */
export async function middleware(req: NextRequest) {
  const email = await verifySessionToken(req.cookies.get(AUTH_COOKIE)?.value);
  if (email) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorised — please sign in." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (req.nextUrl.pathname !== "/") url.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next|login|reset|api/login|api/register|api/forgot|api/reset|api/approve|print|api/images|api/files|samples|brand|fonts|favicon\\.ico|manifest\\.webmanifest).*)",
  ],
};
