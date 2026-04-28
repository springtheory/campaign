import { NextResponse } from "next/server";
import { checkPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  if (!checkPassword(password)) {
    const url = new URL("/login?error=1", req.url);
    return NextResponse.redirect(url, { status: 303 });
  }
  await setSessionCookie();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
