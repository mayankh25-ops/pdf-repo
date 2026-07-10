/**
 * Outbound email via Resend's REST API. No-op (returns false) until
 * RESEND_API_KEY is configured. The default sender works on Resend's free
 * tier without domain verification, but can then only deliver to the email
 * address that owns the Resend account — set EMAIL_FROM to a verified
 * domain sender to email anyone.
 */
export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
        to: [to],
        subject,
        text,
      }),
    });
    if (!res.ok) console.error("[email] send failed", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[email] send failed", err);
    return false;
  }
}

/** Where account-request notifications go. */
export const adminNotifyEmail = () => process.env.ADMIN_NOTIFY_EMAIL || "mayankh.25@gmail.com";
