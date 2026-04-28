# Fall 2026 Campaign Planning

Lean planning board for the user + Celeste to coordinate Fall 2026 cold outreach across ~16-20 courses. Pulls courses from Attio (Schedule object → "Fall 2026 online" list), tracks the per-course pipeline, links to Email Bison campaigns, and has an Opus 4.7 PM agent that posts daily/weekly/monthly digests + within-day nudges to one Slack channel.

This dashboard does **not** store leads or send email. Lead sourcing + sending live in separate packages (Claude Code GTM, Codex GTM, Paperclip V1, …) — this is just the planning layer.

## Stack

- Next.js 15 (App Router), React 19, TypeScript
- Vercel Postgres (Neon) via Drizzle ORM
- Tailwind v4
- Slack Web API, Anthropic SDK (`claude-opus-4-7`)
- Single shared password via signed cookie

## Running locally

```bash
pnpm install
cp .env.example .env.local
# fill in DATABASE_URL, SHARED_PASSWORD, AUTH_COOKIE_SECRET, ANTHROPIC_API_KEY at minimum
pnpm db:push          # creates tables in your dev DB
pnpm db:seed          # seeds the three methods
pnpm dev
```

Visit http://localhost:3000, log in with `SHARED_PASSWORD`.

## Running on claude.ai/code (for Celeste)

This repo is designed so Celeste can open it in claude.ai/code, run `pnpm install && pnpm dev`, and edit/push without local tooling beyond the browser. Each branch redeploys to a Vercel preview automatically.

## Cron schedule (`vercel.json`)

| Path | Cadence (UTC) | Purpose |
|---|---|---|
| `/api/cron/attio-sync` | every hour | upsert courses from Attio |
| `/api/cron/bison-sync` | every 30 min | refresh Bison stats per course |
| `/api/cron/pm-digest` | daily 13:00 UTC (8a ET) | daily digest to Slack |
| `/api/cron/pm-digest?mode=weekly` | Mon 13:00 UTC | weekly digest |
| `/api/cron/pm-digest?mode=monthly` | 1st of month 13:00 UTC | monthly digest |
| `/api/cron/pm-pushy` | hourly 13:00–22:00 UTC, weekdays | within-day nudges |

All cron routes require `?secret=$CRON_SECRET` (or `Authorization: Bearer $CRON_SECRET`) when hit manually.

## How the PM agent works

One Anthropic call per cron tick. No MCP, no tool use, no agent loop.

The system prompt (cached) explains the team and pipeline. The user prompt includes:
- `today` / `now_iso`
- a JSON snapshot of every active course (deadline, days-to-deadline, pipeline timestamps, method, counts, blockers, Bison stats)
- the methods registry
- the last 20 nudges (so the model doesn't repeat itself)

The model returns JSON. For digests it returns `{ channel_post }`; for pushy it returns `{ nudges: [...] }`. Each nudge is hashed (course + kind + first 120 chars) and skipped if a matching hash was posted in the last 12h. New ones get inserted into `nudges` and posted to `SLACK_CHANNEL_ID`.

### What "pushy" actually does

- Sample drafted but not reviewed in >24h → proposes a 15-min review slot and tags @user.
- Send-out <5 days away and full campaign not built → flags Celeste with the blocker.
- Sample started >48h ago and not drafted → asks Celeste what's blocking; if a long method run is in progress, **pushes for a small validation sample before letting the full run continue**.
- Deadline <14 days and method not chosen → flags @user.
- After a stage completes, if there are <3 prior cycle-time data points for that method/stage, the agent may post one process-learning question.

## Methods registry

Each method has a name, kind (`github` | `paperclip` | `other`), description, and link URL. Three are seeded: Claude Code GTM, Codex GTM, Paperclip V1. Add V2 (or anything else) via `/methods`. Each course PATCHes `method_id` from the dropdown and optionally `method_run_url` (e.g. specific GitHub branch or Paperclip team instance).

## Bison

v1 wires the REST API. Set `BISON_BASE_URL` + `BISON_API_KEY`. The mapper in `lib/bison.ts` extracts a campaign id from the URL and hits `${BISON_BASE_URL}/campaigns/{id}/stats`. If your Bison instance uses a different shape, adjust `getCampaignStats`. With env unset, the route returns gracefully and rows just keep their manual values.

## Apollo / previously-replied

No Apollo API integration. Per-course "previously-replied" count is a number Celeste types into the course detail page after she pulls the list from Apollo manually.

## What's intentionally NOT here

Multi-tenant, RBAC, audit log, queue infra, MCP servers, Slack slash commands, lead storage, charts, custom domain, dark mode, tests beyond what's needed. Add complaints first, then features.
