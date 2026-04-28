import { createHash } from "crypto";
import { db, schema } from "../db";
import { callPM } from "../anthropic";
import { postChannel } from "../slack";
import { buildContext } from "./context";

type DigestMode = "daily" | "weekly" | "monthly";
type DigestOut = { channel_post: string };

const PROMPT_BY_MODE: Record<DigestMode, string> = {
  daily:
    "Mode: daily. Produce a Slack post with: what shipped in the last 24h, what's in flight today, who owes whom what by EOD, anything slipping. 5–10 bullets max. Always name people and dates. Output JSON: {\"channel_post\": string}.",
  weekly:
    "Mode: weekly. Produce a Slack post for the start of the week. Include a compact by-course table (name | deadline | stage | risk) followed by a short \"this week's must-finish\" list. Output JSON: {\"channel_post\": string}.",
  monthly:
    "Mode: monthly. Produce a Slack post for the start of the month. Cover deadlines in the next 30 days, capacity check (are we on track for all 16-20 courses?), methods used so far, and any lessons. Output JSON: {\"channel_post\": string}.",
};

export async function runDigest(mode: DigestMode): Promise<{
  ok: boolean;
  posted?: boolean;
  error?: string;
}> {
  const ctx = await buildContext();
  const userPrompt = `${PROMPT_BY_MODE[mode]}\n\nState:\n${JSON.stringify(ctx)}`;

  let parsed: DigestOut;
  try {
    parsed = await callPM<DigestOut>({ userPrompt, schemaName: "digest" });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  const message = parsed.channel_post?.trim();
  if (!message) return { ok: true, posted: false };

  const hash = createHash("sha256")
    .update(`${mode}:${message.slice(0, 200)}`)
    .digest("hex");

  const post = await postChannel(message);

  await db.insert(schema.nudges).values({
    kind: mode,
    severity: "info",
    audience: "channel",
    message,
    modelInputHash: hash,
    postedToSlackTs: post.ts ?? null,
  });

  return { ok: post.ok, posted: post.ok, error: post.error };
}
