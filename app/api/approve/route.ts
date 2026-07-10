import { NextRequest, NextResponse } from "next/server";
import { approvalToken } from "@/lib/auth";
import { getUser, setUserStatus } from "@/lib/store";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

/** Small branded result page for the admin clicking from their inbox. */
const page = (title: string, body: string, ok: boolean) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — Cleaning Works Reports</title>
<style>
  body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;
    background:#F7F6F3;color:#1B1B1B;font-family:-apple-system,"Helvetica Neue",system-ui,sans-serif;padding:24px;box-sizing:border-box}
  .card{max-width:420px;background:#fff;border:1px solid #E9E6E0;border-radius:16px;padding:32px;text-align:center}
  .dot{width:44px;height:44px;border-radius:999px;background:${ok ? "#1E9E57" : "#D9232E"};color:#fff;font-size:20px;font-weight:800;
    display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
  h1{font-size:20px;margin:0 0 8px}
  p{font-size:15px;line-height:1.55;color:#6E6A63;margin:0}
</style>
</head>
<body><div class="card"><div class="dot">${ok ? "✓" : "×"}</div><h1>${title}</h1><p>${body}</p></div></body>
</html>`;

const html = (title: string, body: string, ok: boolean, status = 200) =>
  new NextResponse(page(title, body, ok), {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

/**
 * One-click approve/reject from the admin's notification email. The link is
 * self-authorising: the token is an HMAC over the action + email, so it only
 * works if it came from an email this server generated.
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const action = req.nextUrl.searchParams.get("action");
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!email || (action !== "approve" && action !== "reject")) {
    return html("Invalid link", "This approval link is malformed.", false, 400);
  }
  if ((await approvalToken(email, action)) !== token) {
    return html("Invalid link", "This approval link is not valid for this account.", false, 403);
  }
  const user = await getUser(email);
  if (!user) {
    return html(
      "Account not found",
      "This account no longer exists — it may have been removed, or the server's data was reset.",
      false,
      404,
    );
  }

  if (action === "approve") {
    const already = (user.status ?? "active") === "active";
    await setUserStatus(email, "active");
    if (!already) {
      const proto = req.headers.get("x-forwarded-proto") ?? "https";
      const host = req.headers.get("host") ?? "";
      await sendEmail(
        user.email,
        "Your report portal account is approved",
        `Hi ${user.name},\n\nYour account has been approved. Sign in here:\n${proto}://${host}/login\n\nCleaning Works Reports`,
      );
    }
    return html(
      "User approved",
      `${user.name} (${user.email}) can now sign in and create reports.`,
      true,
    );
  }

  await setUserStatus(email, "rejected");
  return html(
    "Request rejected",
    `${user.name} (${user.email}) will not be able to sign in.`,
    true,
  );
}
