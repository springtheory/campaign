import type { Course } from "./schema";

export type Stage =
  | "idle"
  | "leads_sourced"
  | "sampling"
  | "review"
  | "building"
  | "sent"
  | "at_risk";

export function computeStatus(c: Course): Stage {
  if (c.campaignSentAt) return "sent";
  if (c.fullCampaignBuiltAt) return "building";
  if (c.userReviewedAt) return "building";
  if (c.sampleDraftedAt && !c.userReviewedAt) return "review";
  if (c.coldLeadCount > 0 || c.prevReplyCount > 0) {
    if (c.deadline) {
      const days = daysUntil(c.deadline);
      if (days !== null && days < 14 && !c.methodId) return "at_risk";
    }
    return c.sampleDraftedAt ? "sampling" : "leads_sourced";
  }
  return "idle";
}

export function daysUntil(d: string | Date | null): number | null {
  if (!d) return null;
  const target = typeof d === "string" ? new Date(d) : d;
  const ms = target.getTime() - Date.now();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export const stageColor: Record<Stage, string> = {
  idle: "bg-gray-200 text-gray-700",
  leads_sourced: "bg-blue-100 text-blue-800",
  sampling: "bg-amber-100 text-amber-800",
  review: "bg-purple-100 text-purple-800",
  building: "bg-indigo-100 text-indigo-800",
  sent: "bg-green-100 text-green-800",
  at_risk: "bg-red-100 text-red-800",
};
