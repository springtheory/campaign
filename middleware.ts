import { NextRequest, NextResponse } from "next/server";
import { isAuthedFromCookieValue, SESSION_COOKIE } from "./lib/session";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/login|api/cron|login).*)",
  ],
};

export function middleware(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (isAuthedFromCookieValue(cookie)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}
