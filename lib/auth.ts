/**
 * Portal auth (edge-safe, Web Crypto only).
 * Sessions are `base64url(email).hmac` cookies signed with AUTH_SECRET (or a
 * secret derived from the admin credentials). The built-in admin account
 * (ADMIN_USER / ADMIN_PASS, default admin / Explicit@1234) always works;
 * additional accounts live in the user store.
 */
export const AUTH_COOKIE = "cwr-auth";

const adminUser = () => process.env.ADMIN_USER || "admin";
const adminPass = () => process.env.ADMIN_PASS || "Explicit@1234";
const secret = () => process.env.AUTH_SECRET || `${adminUser()}:${adminPass()}:cwr-portal-v2`;

const enc = new TextEncoder();

const b64u = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
};

const b64uDecode = (value: string): string =>
  atob(value.replaceAll("-", "+").replaceAll("_", "/"));

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return b64u(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export async function createSessionToken(email: string): Promise<string> {
  return `${b64u(enc.encode(email))}.${await hmac(email)}`;
}

/** Returns the signed-in email, or null. */
export async function verifySessionToken(token?: string | null): Promise<string | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const email = b64uDecode(payload);
    return (await hmac(email)) === sig ? email : null;
  } catch {
    return null;
  }
}

export const isAdminCredentials = (user: string, pass: string) =>
  user.trim().toLowerCase() === adminUser().toLowerCase() && pass === adminPass();

export const ADMIN_EMAIL = () => adminUser();

/** Signed token for one-click approve/reject links sent to the admin's email. */
export async function approvalToken(
  email: string,
  action: "approve" | "reject",
): Promise<string> {
  return hmac(`user-approval:${action}:${email.trim().toLowerCase()}`);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(`${salt}:${password}:cwr`));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
