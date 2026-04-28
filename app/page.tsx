import Link from "next/link";
import { asc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { computeStatus, daysUntil, stageColor } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function Board() {
  const rows = await db
    .select()
    .from(schema.courses)
    .where(isNull(schema.courses.archivedAt))
    .orderBy(asc(schema.courses.deadline));

  const methodList = await db.select().from(schema.methods);
  const methodById = new Map(methodList.map((m) => [m.id, m]));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Board</h1>
        <a
          href="/api/cron/attio-sync"
          className="rounded border bg-white px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          Sync Attio
        </a>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Deadline</th>
              <th className="px-3 py-2">Send-out</th>
              <th className="px-3 py-2">Cold</th>
              <th className="px-3 py-2">Prev-reply</th>
              <th className="px-3 py-2">Method</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                  No courses yet. Hit &quot;Sync Attio&quot; or add one.
                </td>
              </tr>
            )}
            {rows.map((c) => {
              const stage = computeStatus(c);
              const dd = daysUntil(c.deadline);
              const method = c.methodId ? methodById.get(c.methodId) : null;
              return (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <Link
                      href={`/courses/${c.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {c.deadline ? (
                      <span>
                        {c.deadline}{" "}
                        {dd !== null && (
                          <span
                            className={
                              dd < 7
                                ? "text-red-600"
                                : dd < 21
                                ? "text-amber-700"
                                : "text-gray-500"
                            }
                          >
                            ({dd}d)
                          </span>
                        )}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">{c.sendOutDate ?? "—"}</td>
                  <td className="px-3 py-2">{c.coldLeadCount}</td>
                  <td className="px-3 py-2">{c.prevReplyCount}</td>
                  <td className="px-3 py-2">{method?.name ?? "—"}</td>
                  <td className="px-3 py-2">{c.owner ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${stageColor[stage]}`}
                    >
                      {stage.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
