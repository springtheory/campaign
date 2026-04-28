import {
  pgTable,
  uuid,
  text,
  integer,
  date,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

export const methods = pgTable("methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  linkUrl: text("link_url"),
  kind: text("kind").notNull().default("github"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  attioRecordId: text("attio_record_id").unique(),
  name: text("name").notNull(),
  spots: integer("spots"),
  deadline: date("deadline"),
  sendOutDate: date("send_out_date"),
  coldLeadCount: integer("cold_lead_count").notNull().default(0),
  prevReplyCount: integer("prev_reply_count").notNull().default(0),
  sampleDraftedAt: timestamp("sample_drafted_at", { withTimezone: true }),
  userReviewedAt: timestamp("user_reviewed_at", { withTimezone: true }),
  fullCampaignBuiltAt: timestamp("full_campaign_built_at", { withTimezone: true }),
  campaignSentAt: timestamp("campaign_sent_at", { withTimezone: true }),
  bisonCampaignUrl: text("bison_campaign_url"),
  bisonStatsJson: jsonb("bison_stats_json"),
  bisonSyncedAt: timestamp("bison_synced_at", { withTimezone: true }),
  methodId: uuid("method_id").references(() => methods.id),
  methodRunUrl: text("method_run_url"),
  owner: text("owner"),
  notes: text("notes"),
  blockers: text("blockers"),
  status: text("status").notNull().default("idle"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  attioSyncedAt: timestamp("attio_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const nudges = pgTable("nudges", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id),
  kind: text("kind").notNull(),
  severity: text("severity").notNull().default("info"),
  audience: text("audience").notNull().default("channel"),
  message: text("message").notNull(),
  modelInputHash: text("model_input_hash"),
  postedToSlackTs: text("posted_to_slack_ts"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const attioSyncRuns = pgTable("attio_sync_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  ok: boolean("ok"),
  coursesUpserted: integer("courses_upserted"),
  error: text("error"),
});

export const bisonSyncRuns = pgTable("bison_sync_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  ok: boolean("ok"),
  coursesSynced: integer("courses_synced"),
  error: text("error"),
});

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Method = typeof methods.$inferSelect;
export type Nudge = typeof nudges.$inferSelect;
