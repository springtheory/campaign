import { eq, and, isNotNull, notInArray } from "drizzle-orm";
import { db, schema } from "./db";

type AttioConfig = {
  apiKey: string;
  scheduleObject: string;
  listId: string;
  fields: { name: string; spots: string; deadline: string };
};

function readConfig(): AttioConfig | null {
  const c = {
    apiKey: process.env.ATTIO_API_KEY,
    scheduleObject: process.env.ATTIO_SCHEDULE_OBJECT,
    listId: process.env.ATTIO_FALL2026_LIST_ID,
    fields: {
      name: process.env.ATTIO_FIELD_NAME,
      spots: process.env.ATTIO_FIELD_SPOTS,
      deadline: process.env.ATTIO_FIELD_DEADLINE,
    },
  };
  if (
    !c.apiKey ||
    !c.scheduleObject ||
    !c.listId ||
    !c.fields.name ||
    !c.fields.spots ||
    !c.fields.deadline
  ) {
    return null;
  }
  return c as AttioConfig;
}

function pickValue(values: unknown, fieldId: string): unknown {
  if (!values || typeof values !== "object") return null;
  const obj = values as Record<string, unknown>;
  const arr = obj[fieldId];
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const first = arr[0] as Record<string, unknown>;
  return (
    first.value ??
    first.target_object ??
    first.option ??
    first.full_name ??
    first.formatted ??
    first
  );
}

function asString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && v && "value" in (v as object)) {
    const inner = (v as { value: unknown }).value;
    return inner == null ? null : String(inner);
  }
  return null;
}

function asInt(v: unknown): number | null {
  const s = asString(v);
  if (s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function asDate(v: unknown): string | null {
  const s = asString(v);
  if (!s) return null;
  return s.slice(0, 10);
}

export async function syncSchedule(): Promise<{
  ok: boolean;
  upserted: number;
  error?: string;
}> {
  const cfg = readConfig();
  if (!cfg) {
    return {
      ok: false,
      upserted: 0,
      error:
        "Missing ATTIO_* env vars. Fill in ATTIO_API_KEY, ATTIO_SCHEDULE_OBJECT, ATTIO_FALL2026_LIST_ID, ATTIO_FIELD_NAME, ATTIO_FIELD_SPOTS, ATTIO_FIELD_DEADLINE.",
    };
  }

  const [run] = await db
    .insert(schema.attioSyncRuns)
    .values({})
    .returning({ id: schema.attioSyncRuns.id });

  try {
    const seenAttioIds: string[] = [];
    let upserted = 0;
    let cursor: string | undefined;

    while (true) {
      const body: Record<string, unknown> = { limit: 100 };
      if (cursor) body.offset = cursor;
      const res = await fetch(
        `https://api.attio.com/v2/lists/${cfg.listId}/entries/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfg.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        throw new Error(`Attio ${res.status}: ${await res.text()}`);
      }
      const json = (await res.json()) as {
        data: Array<{
          id: { entry_id: string };
          parent_record_id: string;
          entry_values: Record<string, unknown>;
        }>;
        next_offset?: string;
      };

      for (const entry of json.data) {
        const recordId = entry.parent_record_id;
        if (!recordId) continue;
        seenAttioIds.push(recordId);

        const name = asString(pickValue(entry.entry_values, cfg.fields.name)) ?? "(unnamed)";
        const spots = asInt(pickValue(entry.entry_values, cfg.fields.spots));
        const deadline = asDate(pickValue(entry.entry_values, cfg.fields.deadline));

        await db
          .insert(schema.courses)
          .values({
            attioRecordId: recordId,
            name,
            spots: spots ?? null,
            deadline: deadline ?? null,
            attioSyncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: schema.courses.attioRecordId,
            set: {
              name,
              spots: spots ?? null,
              deadline: deadline ?? null,
              attioSyncedAt: new Date(),
              archivedAt: null,
              updatedAt: new Date(),
            },
          });
        upserted++;
      }

      if (!json.next_offset) break;
      cursor = json.next_offset;
    }

    if (seenAttioIds.length > 0) {
      await db
        .update(schema.courses)
        .set({ archivedAt: new Date() })
        .where(
          and(
            isNotNull(schema.courses.attioRecordId),
            notInArray(schema.courses.attioRecordId, seenAttioIds)
          )
        );
    }

    await db
      .update(schema.attioSyncRuns)
      .set({ finishedAt: new Date(), ok: true, coursesUpserted: upserted })
      .where(eq(schema.attioSyncRuns.id, run.id));

    return { ok: true, upserted };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await db
      .update(schema.attioSyncRuns)
      .set({ finishedAt: new Date(), ok: false, error })
      .where(eq(schema.attioSyncRuns.id, run.id));
    return { ok: false, upserted: 0, error };
  }
}
