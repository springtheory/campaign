import { cookies } from "next/headers";
import { SESSION_COOKIE, signValue, verifyValue } from "./session";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function checkPassword(input: string): boolean {
  const expected = process.env.SHARED_PASSWORD ?? "";
  if (!expected) return false;
  if (input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < input.length; i++) {
    diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function setSessionCookie() {
  const value = await signValue(`ok:${Date.now()}`);
  (await cookies()).set({
    name: SESSION_COOKIE,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isAuthed(): Promise<boolean> {
  const c = (await cookies()).get(SESSION_COOKIE);
  if (!c) return false;
  return (await verifyValue(c.value)) !== null;
}
