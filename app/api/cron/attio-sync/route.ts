import { NextResponse } from "next/server";
import { syncSchedule } from "@/lib/attio";
import { authorizeCron } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const denied = authorizeCron(req);
  if (denied) return denied;
  const result = await syncSchedule();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
