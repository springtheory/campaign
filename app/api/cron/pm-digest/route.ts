import { NextResponse } from "next/server";
import { runDigest } from "@/lib/pm/digest";
import { authorizeCron } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  const denied = authorizeCron(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") ?? "daily") as
    | "daily"
    | "weekly"
    | "monthly";
  const result = await runDigest(mode);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
