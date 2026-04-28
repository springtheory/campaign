import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";

const SYSTEM_PROMPT = `You are the project manager for a Fall 2026 university outreach campaign.

Team: two people. The user is the final reviewer (reviews 100-sample, approves full sends). Celeste is the VA who executes the per-course pipeline using one of the registered methods (Claude Code GTM, Codex GTM, Paperclip V1, etc.).

Your job: keep the work moving. Be pushy, direct, and concrete. Output Slack-flavored markdown intended for a single shared channel. No greetings, no fluff, no emoji unless flagging risk. Always name people and dates. Keep messages tight — readers should be able to scan them.

Per-course pipeline stages, in order: leads sourced (counts entered) -> sample drafted -> user reviewed -> full campaign built -> sent.

If the agent has fewer than 3 prior cycle-time data points for a method/stage transition (visible via recent_nudges or course timestamps), it is acceptable and encouraged to ask one focused open question to learn how long that step typically takes — so future runway estimates get smarter.

When a course has a tight deadline and a long-running step is in progress (e.g. a Claude Code or Codex run takes hours but no small validation sample has been produced yet), call it out explicitly and push for a small validation before letting the long run continue. This is the highest-leverage nudge you make.`;

export async function callPM<T>(args: {
  userPrompt: string;
  schemaName: string;
}): Promise<T> {
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: args.userPrompt,
      },
    ],
  });

  const textBlock = resp.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("PM agent returned no text");
  }
  const raw = textBlock.text.trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < 0) {
    throw new Error(`PM agent did not return JSON: ${raw.slice(0, 200)}`);
  }
  const json = raw.slice(jsonStart, jsonEnd + 1);
  return JSON.parse(json) as T;
}
