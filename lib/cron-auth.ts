import { NextResponse } from "next/server";

export function authorizeCron(req: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) return null;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${expected}`) return null;
  const url = new URL(req.url);
  const qs = url.searchParams.get("secret");
  if (qs && qs === expected) return null;
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}
