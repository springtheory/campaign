import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

async function createMethod(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await db
    .insert(schema.methods)
    .values({
      name,
      description: String(formData.get("description") ?? ""),
      linkUrl: String(formData.get("linkUrl") ?? ""),
      kind: String(formData.get("kind") ?? "github"),
    })
    .onConflictDoNothing();
  revalidatePath("/methods");
}

async function updateMethod(id: string, formData: FormData) {
  "use server";
  await db
    .update(schema.methods)
    .set({
      description: String(formData.get("description") ?? ""),
      linkUrl: String(formData.get("linkUrl") ?? ""),
      kind: String(formData.get("kind") ?? "github"),
    })
    .where(eq(schema.methods.id, id));
  revalidatePath("/methods");
}

export default async function MethodsPage() {
  const list = await db.select().from(schema.methods).orderBy(schema.methods.createdAt);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Methods</h1>
      <p className="text-sm text-gray-600">
        Each campaign is run with one method. Add new ones (e.g. Paperclip V2)
        as you make them. Description should explain where the package lives
        and roughly how a run works.
      </p>

      <div className="space-y-3">
        {list.map((m) => {
          const action = updateMethod.bind(null, m.id);
          return (
            <form
              key={m.id}
              action={action}
              className="grid grid-cols-1 gap-2 rounded border bg-white p-4 md:grid-cols-[200px_1fr_auto]"
            >
              <div>
                <div className="font-medium">{m.name}</div>
                <select name="kind" defaultValue={m.kind} className="input mt-1">
                  <option value="github">GitHub</option>
                  <option value="paperclip">Paperclip</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <input
                  name="linkUrl"
                  defaultValue={m.linkUrl ?? ""}
                  placeholder="GitHub repo or Paperclip team URL"
                  className="input"
                />
                <textarea
                  name="description"
                  defaultValue={m.description ?? ""}
                  placeholder="Where it lives, what it does, how long a run takes"
                  rows={2}
                  className="input"
                />
              </div>
              <div className="self-end">
                <button className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white">
                  Save
                </button>
              </div>
            </form>
          );
        })}
      </div>

      <form
        action={createMethod}
        className="rounded border bg-white p-4 space-y-2"
      >
        <h2 className="font-semibold">Add a method</h2>
        <input name="name" placeholder="e.g. Paperclip V2" className="input" required />
        <select name="kind" defaultValue="github" className="input">
          <option value="github">GitHub</option>
          <option value="paperclip">Paperclip</option>
          <option value="other">Other</option>
        </select>
        <input name="linkUrl" placeholder="Link" className="input" />
        <textarea
          name="description"
          placeholder="Description"
          rows={2}
          className="input"
        />
        <button className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white">
          Add
        </button>
      </form>
    </div>
  );
}
