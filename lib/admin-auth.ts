import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Admin session: a signed cookie, no user accounts.
 *
 * The password lives only in ADMIN_PASSWORD and is never stored or logged.
 * If it isn't set, admin is closed rather than open — a missing env var must
 * not become an unlocked door.
 */

const COOKIE = "vm_admin";
const MAX_AGE = 60 * 60 * 12; // 12 hours

function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    ""
  );
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function makeToken(): string {
  const expires = Date.now() + MAX_AGE * 1000;
  return `${expires}.${sign(String(expires))}`;
}

export function tokenValid(token: string | undefined): boolean {
  if (!token || !adminConfigured()) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig) return false;
  if (Number(expires) < Date.now()) return false;
  const expected = sign(expires);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function passwordMatches(candidate: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(real);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return tokenValid(store.get(COOKIE)?.value);
}

export const COOKIE_NAME = COOKIE;
export const COOKIE_MAX_AGE = MAX_AGE;
