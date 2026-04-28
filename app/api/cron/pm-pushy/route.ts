import { NextResponse } from "next/server";
import { runPushy } from "@/lib/pm/pushy";
import { authorizeCron } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  const denied = authorizeCron(req);
  if (denied) return denied;
  const result = await runPushy();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
