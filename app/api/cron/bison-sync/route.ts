import { NextResponse } from "next/server";
import { syncAllBison } from "@/lib/bison";
import { authorizeCron } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const denied = authorizeCron(req);
  if (denied) return denied;
  const result = await syncAllBison();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
