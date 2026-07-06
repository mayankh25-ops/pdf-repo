/**
 * Simple portal gate (edge-safe, no Node APIs). Credentials come from env
 * with the agreed defaults; the session cookie holds a SHA-256 of them so the
 * plaintext never leaves the server.
 */
export const AUTH_COOKIE = "cwr-auth";

const user = () => process.env.ADMIN_USER || "admin";
const pass = () => process.env.ADMIN_PASS || "Explicit@1234";

export const checkCredentials = (u: string, p: string) => u === user() && p === pass();

export async function expectedToken(): Promise<string> {
  const data = new TextEncoder().encode(`${user()}:${pass()}:cwr-portal-v1`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
