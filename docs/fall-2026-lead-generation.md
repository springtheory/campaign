# Fall 2026 lead generation

The autonomous lead-research pipeline lives in
[`springtheory/blitz-api-`](https://github.com/springtheory/blitz-api-) on branch
`claude/fall-2026-lead-generation-XB5jE`. This repo is **not** the home for the
sourcing logic; we keep this app focused on planning + dashboard concerns and let
`blitz-api-` own outbound research, Apollo, Drive, scoring, and the autoresearch
self-improving loop.

## What that pipeline does

1. Reads class write-ups from the configured Drive folder
   (`DRIVE_INPUT_FOLDER_ID`, default `1HfUGTMlYzBOlk7sT__fqyOT9d1gXu2Ya`).
2. Plans 4–7 ICP angles per class via Claude.
3. Sources candidates via Apollo people search per angle.
4. Enriches each company via Exa, scores per-lead via Claude.
5. Dedupes, ranks, and uploads a per-class CSV back into Drive (one subfolder per
   class). **No email sending in this scope** — Bison/Apollo sequencing is a
   downstream human step.
6. Wraps the whole thing in a karpathy/autoresearch-style overnight loop that
   iterates on `recipe.ts` (the only editable file), keeps wins, discards losses
   via git reset, and journals to `results.tsv`.

## What this repo does (still)

- Cycle-time tracking and PM nudges (`lib/anthropic.ts`, `lib/slack.ts`).
- Bison stats sync (`lib/bison.ts`).
- Attio sync (`lib/attio.ts`).

If we later want a dashboard for the Fall 2026 burst (per-class lead counts, recipe
iteration history, Slack digests), this is the right home — it'd query
`blitz-api-`'s Postgres directly via a read-only role.

## Patterns shared between repos

- `lib/slack.ts` — `postChannel(text)` is duplicated, not imported, to keep repos
  independent. Don't drift the contract.
- Drizzle conventions — timestamp defaults, JSONB raw, unique indexes on external
  IDs, soft delete via `archivedAt`.

## Plan

`/root/.claude/plans/help-me-build-a-scalable-reef.md`
