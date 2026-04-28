import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { computeStatus, stageColor } from "@/lib/status";

export const dynamic = "force-dynamic";

async function updateCourse(id: string, formData: FormData) {
  "use server";
  const get = (k: string) => {
    const v = formData.get(k);
    return v === null || v === "" ? null : String(v);
  };
  const intOrZero = (k: string) => {
    const v = formData.get(k);
    if (v === null || v === "") return 0;
    return Number(v);
  };
  const ts = (k: string) => {
    const v = get(k);
    return v ? new Date(v) : null;
  };

  const methodId = get("methodId");
  await db
    .update(schema.courses)
    .set({
      name: get("name") ?? "",
      sendOutDate: get("sendOutDate"),
      coldLeadCount: intOrZero("coldLeadCount"),
      prevReplyCount: intOrZero("prevReplyCount"),
      sampleDraftedAt: ts("sampleDraftedAt"),
      userReviewedAt: ts("userReviewedAt"),
      fullCampaignBuiltAt: ts("fullCampaignBuiltAt"),
      campaignSentAt: ts("campaignSentAt"),
      bisonCampaignUrl: get("bisonCampaignUrl"),
      methodId: methodId,
      methodRunUrl: get("methodRunUrl"),
      owner: get("owner"),
      notes: get("notes"),
      blockers: get("blockers"),
      updatedAt: new Date(),
    })
    .where(eq(schema.courses.id, id));
  redirect(`/courses/${id}`);
}

function dtLocal(d: Date | null): string {
  if (!d) return "";
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function CourseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [c] = await db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.id, id));
  if (!c) notFound();

  const methods = await db.select().from(schema.methods);
  const stage = computeStatus(c);
  const action = updateCourse.bind(null, c.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">{c.name}</h1>
        <span className={`rounded px-2 py-0.5 text-xs ${stageColor[stage]}`}>
          {stage.replace("_", " ")}
        </span>
      </div>

      <form action={action} className="grid grid-cols-2 gap-4 rounded-lg border bg-white p-4">
        <Field label="Name">
          <input name="name" defaultValue={c.name} className="input" />
        </Field>
        <Field label="Owner">
          <select name="owner" defaultValue={c.owner ?? ""} className="input">
            <option value="">—</option>
            <option value="celeste">Celeste</option>
            <option value="user">Me</option>
          </select>
        </Field>
        <Field label="Deadline (from Attio)">
          <input value={c.deadline ?? ""} disabled className="input bg-gray-100" />
        </Field>
        <Field label="Spots (from Attio)">
          <input value={c.spots ?? ""} disabled className="input bg-gray-100" />
        </Field>
        <Field label="Send-out date">
          <input
            type="date"
            name="sendOutDate"
            defaultValue={c.sendOutDate ?? ""}
            className="input"
          />
        </Field>
        <Field label="Method">
          <select name="methodId" defaultValue={c.methodId ?? ""} className="input">
            <option value="">—</option>
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cold lead count">
          <input
            type="number"
            name="coldLeadCount"
            defaultValue={c.coldLeadCount}
            className="input"
          />
        </Field>
        <Field label="Previously-replied count">
          <input
            type="number"
            name="prevReplyCount"
            defaultValue={c.prevReplyCount}
            className="input"
          />
        </Field>
        <Field label="Sample drafted at">
          <input
            type="datetime-local"
            name="sampleDraftedAt"
            defaultValue={dtLocal(c.sampleDraftedAt)}
            className="input"
          />
        </Field>
        <Field label="User reviewed at">
          <input
            type="datetime-local"
            name="userReviewedAt"
            defaultValue={dtLocal(c.userReviewedAt)}
            className="input"
          />
        </Field>
        <Field label="Full campaign built at">
          <input
            type="datetime-local"
            name="fullCampaignBuiltAt"
            defaultValue={dtLocal(c.fullCampaignBuiltAt)}
            className="input"
          />
        </Field>
        <Field label="Campaign sent at">
          <input
            type="datetime-local"
            name="campaignSentAt"
            defaultValue={dtLocal(c.campaignSentAt)}
            className="input"
          />
        </Field>
        <Field label="Bison campaign URL">
          <input
            name="bisonCampaignUrl"
            defaultValue={c.bisonCampaignUrl ?? ""}
            className="input"
          />
        </Field>
        <Field label="Method run URL (GitHub branch / Paperclip team)">
          <input
            name="methodRunUrl"
            defaultValue={c.methodRunUrl ?? ""}
            className="input"
          />
        </Field>
        <Field label="Notes" full>
          <textarea
            name="notes"
            defaultValue={c.notes ?? ""}
            rows={3}
            className="input"
          />
        </Field>
        <Field label="Blockers" full>
          <textarea
            name="blockers"
            defaultValue={c.blockers ?? ""}
            rows={2}
            className="input"
          />
        </Field>
        <div className="col-span-2 flex justify-end">
          <button
            className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-gray-700"
            type="submit"
          >
            Save
          </button>
        </div>
      </form>

      {c.bisonStatsJson ? (
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-2 font-semibold">Bison stats</h2>
          <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-xs">
            {JSON.stringify(c.bisonStatsJson, null, 2)}
          </pre>
          {c.bisonSyncedAt ? (
            <p className="mt-1 text-xs text-gray-500">
              Last sync: {new Date(c.bisonSyncedAt).toLocaleString()}
            </p>
          ) : null}
        </section>
      ) : null}

    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}
