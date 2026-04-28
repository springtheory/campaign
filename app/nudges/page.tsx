import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

const SEVERITY_COLOR: Record<string, string> = {
  info: "bg-gray-100 text-gray-700",
  warn: "bg-amber-100 text-amber-800",
  risk: "bg-red-100 text-red-800",
};

export default async function NudgesPage() {
  const list = await db
    .select()
    .from(schema.nudges)
    .orderBy(desc(schema.nudges.createdAt))
    .limit(100);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Nudges</h1>
      <p className="text-sm text-gray-600">
        Last 100 messages the PM agent posted to Slack. New ones are deduped
        against the last 12 hours to keep the channel quiet.
      </p>

      <ul className="space-y-2">
        {list.map((n) => (
          <li key={n.id} className="rounded border bg-white p-3">
            <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
              <span className={`rounded px-2 py-0.5 ${SEVERITY_COLOR[n.severity]}`}>
                {n.severity}
              </span>
              <span className="rounded bg-gray-100 px-2 py-0.5">{n.kind}</span>
              <span>{new Date(n.createdAt).toLocaleString()}</span>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm">{n.message}</pre>
          </li>
        ))}
        {list.length === 0 && (
          <li className="rounded border bg-white p-6 text-center text-gray-500">
            No nudges yet. The agent will post once the cron runs.
          </li>
        )}
      </ul>
    </div>
  );
}
