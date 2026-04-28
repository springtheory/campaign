import { eq, isNotNull } from "drizzle-orm";
import { db, schema } from "./db";

export type BisonStats = {
  steps?: Array<{ index: number; sent_at?: string; sent?: number }>;
  total_sent?: number;
  replies?: number;
  opens?: number;
  raw?: unknown;
};

function extractCampaignId(url: string): string | null {
  const m = url.match(/campaigns?\/([^/?#]+)/i);
  return m?.[1] ?? null;
}

export async function getCampaignStats(url: string): Promise<BisonStats | null> {
  const base = process.env.BISON_BASE_URL;
  const key = process.env.BISON_API_KEY;
  if (!base || !key) return null;

  const id = extractCampaignId(url);
  if (!id) return null;

  const res = await fetch(`${base.replace(/\/$/, "")}/campaigns/${id}/stats`, {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Bison ${res.status}: ${await res.text()}`);
  }
  const raw = (await res.json()) as Record<string, unknown>;

  const stats: BisonStats = { raw };
  if (Array.isArray(raw.steps)) {
    stats.steps = (raw.steps as Array<Record<string, unknown>>).map((s, i) => ({
      index: typeof s.index === "number" ? s.index : i,
      sent_at: typeof s.sent_at === "string" ? s.sent_at : undefined,
      sent: typeof s.sent === "number" ? s.sent : undefined,
    }));
  }
  if (typeof raw.total_sent === "number") stats.total_sent = raw.total_sent;
  if (typeof raw.replies === "number") stats.replies = raw.replies;
  if (typeof raw.opens === "number") stats.opens = raw.opens;
  return stats;
}

export async function syncAllBison(): Promise<{
  ok: boolean;
  synced: number;
  error?: string;
}> {
  const [run] = await db
    .insert(schema.bisonSyncRuns)
    .values({})
    .returning({ id: schema.bisonSyncRuns.id });

  try {
    const rows = await db
      .select()
      .from(schema.courses)
      .where(isNotNull(schema.courses.bisonCampaignUrl));

    let synced = 0;
    for (const c of rows) {
      if (!c.bisonCampaignUrl) continue;
      try {
        const stats = await getCampaignStats(c.bisonCampaignUrl);
        if (stats) {
          await db
            .update(schema.courses)
            .set({ bisonStatsJson: stats, bisonSyncedAt: new Date() })
            .where(eq(schema.courses.id, c.id));
          synced++;
        }
      } catch {
        // single-row failure shouldn't kill the whole run
      }
    }

    await db
      .update(schema.bisonSyncRuns)
      .set({ finishedAt: new Date(), ok: true, coursesSynced: synced })
      .where(eq(schema.bisonSyncRuns.id, run.id));
    return { ok: true, synced };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await db
      .update(schema.bisonSyncRuns)
      .set({ finishedAt: new Date(), ok: false, error })
      .where(eq(schema.bisonSyncRuns.id, run.id));
    return { ok: false, synced: 0, error };
  }
}
