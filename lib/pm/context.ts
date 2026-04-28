import { desc, isNull } from "drizzle-orm";
import { db, schema } from "../db";
import { computeStatus, daysUntil } from "../status";

export type PMContext = {
  today: string;
  now_iso: string;
  courses: Array<{
    id: string;
    name: string;
    deadline: string | null;
    days_to_deadline: number | null;
    send_out_date: string | null;
    counts: { cold: number; prev_reply: number };
    pipeline: {
      sample_drafted_at: string | null;
      user_reviewed_at: string | null;
      full_campaign_built_at: string | null;
      campaign_sent_at: string | null;
    };
    method: { id: string; name: string; kind: string } | null;
    method_run_url: string | null;
    owner: string | null;
    blockers: string | null;
    notes: string | null;
    bison: {
      url: string | null;
      synced_at: string | null;
      stats: unknown;
    };
    status: string;
  }>;
  methods: Array<{
    id: string;
    name: string;
    kind: string;
    description: string | null;
  }>;
  recent_nudges: Array<{
    course_id: string | null;
    kind: string;
    severity: string;
    message: string;
    created_at: string;
  }>;
};

export async function buildContext(): Promise<PMContext> {
  const now = new Date();
  const courses = await db
    .select()
    .from(schema.courses)
    .where(isNull(schema.courses.archivedAt));
  const methods = await db.select().from(schema.methods);
  const methodById = new Map(methods.map((m) => [m.id, m]));

  const recent = await db
    .select()
    .from(schema.nudges)
    .orderBy(desc(schema.nudges.createdAt))
    .limit(20);

  return {
    today: now.toISOString().slice(0, 10),
    now_iso: now.toISOString(),
    courses: courses.map((c) => {
      const m = c.methodId ? methodById.get(c.methodId) : null;
      return {
        id: c.id,
        name: c.name,
        deadline: c.deadline ?? null,
        days_to_deadline: daysUntil(c.deadline),
        send_out_date: c.sendOutDate ?? null,
        counts: { cold: c.coldLeadCount, prev_reply: c.prevReplyCount },
        pipeline: {
          sample_drafted_at: c.sampleDraftedAt?.toISOString() ?? null,
          user_reviewed_at: c.userReviewedAt?.toISOString() ?? null,
          full_campaign_built_at: c.fullCampaignBuiltAt?.toISOString() ?? null,
          campaign_sent_at: c.campaignSentAt?.toISOString() ?? null,
        },
        method: m ? { id: m.id, name: m.name, kind: m.kind } : null,
        method_run_url: c.methodRunUrl ?? null,
        owner: c.owner ?? null,
        blockers: c.blockers ?? null,
        notes: c.notes ?? null,
        bison: {
          url: c.bisonCampaignUrl ?? null,
          synced_at: c.bisonSyncedAt?.toISOString() ?? null,
          stats: c.bisonStatsJson ?? null,
        },
        status: computeStatus(c),
      };
    }),
    methods: methods.map((m) => ({
      id: m.id,
      name: m.name,
      kind: m.kind,
      description: m.description ?? null,
    })),
    recent_nudges: recent.map((n) => ({
      course_id: n.courseId ?? null,
      kind: n.kind,
      severity: n.severity,
      message: n.message,
      created_at: n.createdAt.toISOString(),
    })),
  };
}
