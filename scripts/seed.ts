import { db, schema } from "../lib/db";

async function main() {
  await db
    .insert(schema.methods)
    .values([
      {
        name: "Claude Code GTM",
        kind: "github",
        description:
          "Claude Code package that orchestrates external APIs to source leads and write emails. Local repo, ~1GB.",
        linkUrl: "",
      },
      {
        name: "Codex GTM",
        kind: "github",
        description:
          "Codex variant of the GTM package — same shape, different model. Local repo, ~1GB.",
        linkUrl: "",
      },
      {
        name: "Paperclip V1",
        kind: "paperclip",
        description:
          "First Paperclip agent-team approach. Runs as an agent team rather than a local CLI run.",
        linkUrl: "",
      },
    ])
    .onConflictDoNothing();
  console.log("Seeded methods.");
}

main().then(() => process.exit(0));
