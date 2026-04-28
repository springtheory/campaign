import { WebClient } from "@slack/web-api";

let client: WebClient | null = null;
function getClient(): WebClient | null {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return null;
  client ??= new WebClient(token);
  return client;
}

export async function postChannel(text: string): Promise<{ ok: boolean; ts?: string; error?: string }> {
  const c = getClient();
  const channel = process.env.SLACK_CHANNEL_ID;
  if (!c || !channel) {
    return { ok: false, error: "Slack not configured (SLACK_BOT_TOKEN / SLACK_CHANNEL_ID)" };
  }
  try {
    const res = await c.chat.postMessage({
      channel,
      text,
      mrkdwn: true,
      unfurl_links: false,
      unfurl_media: false,
    });
    return { ok: true, ts: res.ts };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
