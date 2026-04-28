import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "campaign_session";

export function signValue(value: string): string {
  const secret = process.env.AUTH_COOKIE_SECRET ?? "";
  const mac = createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${mac}`;
}

export function verifyValue(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const expected = signValue(value);
  const a = Buffer.from(signed);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? value : null;
}

export function isAuthedFromCookieValue(value: string | undefined): boolean {
  if (!value) return false;
  return verifyValue(value) !== null;
}
