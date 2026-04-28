import { createHash } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "../db";
import { callPM } from "../anthropic";
import { postChannel } from "../slack";
import { buildContext } from "./context";

type PushyOut = {
  nudges: Array<{
    course_id: string | null;
    severity: "info" | "warn" | "risk";
    message: string;
  }>;
};

const PROMPT = `Mode: pushy. For each course, decide whether a nudge is warranted RIGHT NOW. Apply these rules:

- Sample drafted but not user-reviewed in >24h -> propose a 15-min review slot today, name the user (use "@user" — the channel knows who that is).
- Send-out date <5 days away and full campaign not yet built -> name Celeste and the blocker.
- Sample started >48h ago and not drafted -> ask Celeste what's blocking. If a long-running method run is in progress, push for a small validation sample BEFORE letting the full run continue.
- Deadline <14 days and method not chosen -> name the user.
- When a stage just completed and you have <3 prior cycle-time data points for that method+stage in recent_nudges, you may post one open question to the channel asking how long it took and what was tricky.
- Otherwise stay silent for that course.

Avoid repeating any nudge already sent in the last 12h (see recent_nudges). Be terse — one or two sentences per nudge.

Return JSON: {"nudges": [{"course_id": string|null, "severity": "info"|"warn"|"risk", "message": string}]}. Empty array is fine.`;

export async function runPushy(): Promise<{
  ok: boolean;
  posted: number;
  error?: string;
}> {
  const ctx = await buildContext();
  const userPrompt = `${PROMPT}\n\nState:\n${JSON.stringify(ctx)}`;

  let parsed: PushyOut;
  try {
    parsed = await callPM<PushyOut>({ userPrompt, schemaName: "pushy" });
  } catch (err) {
    return { ok: false, posted: 0, error: err instanceof Error ? err.message : String(err) };
  }

  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
  let posted = 0;

  for (const n of parsed.nudges ?? []) {
    if (!n.message?.trim()) continue;

    const hashKey = `${n.course_id ?? "global"}:pushy:${n.message.slice(0, 120)}`;
    const hash = createHash("sha256").update(hashKey).digest("hex");

    const dup = await db
      .select({ id: schema.nudges.id })
      .from(schema.nudges)
      .where(
        and(eq(schema.nudges.modelInputHash, hash), gt(schema.nudges.createdAt, cutoff))
      )
      .limit(1);
    if (dup.length > 0) continue;

    const post = await postChannel(n.message);
    await db.insert(schema.nudges).values({
      courseId: n.course_id ?? null,
      kind: "pushy",
      severity: n.severity ?? "info",
      audience: "channel",
      message: n.message,
      modelInputHash: hash,
      postedToSlackTs: post.ts ?? null,
    });
    if (post.ok) posted++;
  }

  return { ok: true, posted };
}
