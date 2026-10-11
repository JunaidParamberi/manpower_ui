# Manpower UI — Documentation

The complete **Manpower** workspace front end running 100% locally. Every
screen works, every create / edit / delete persists — with no Supabase, no AI
model, no billing provider and no email service behind it.

Start here:

| Doc | What it covers |
|---|---|
| [Getting started](./getting-started.md) | Install, run, sign in, reset the demo |
| [User guide](./user-guide.md) | Every screen, panel and shortcut, explained |
| [Architecture](./architecture.md) | How the mock layer works and how to extend it |
| [Development](./development.md) | Scripts, tests, Storybook, patterns and gotchas |

## What this is

This repo is the front end extracted from the full-stack **Craftly** app. The
app's own code — ~107 query modules, 60+ server actions, all React components
and pages — is untouched. Only the thin seams underneath were rewritten:

| Layer | Real app | This repo |
|---|---|---|
| Database | Supabase Postgres | `mock-db.json` on disk, Supabase-compatible query builder |
| Auth | Supabase Auth | `mock_session` cookie, same supabase-js auth API |
| Storage | Supabase Storage | `mock-storage/` folder, served by a local route |
| AI panel (Kraft) | Anthropic model | Scripted SSE streamer, same wire format |
| Billing | LemonSqueezy | Mock checkout that logs to the console |
| Email | Resend | `console.log("[mock-email] …")` |

## The 30-second tour

```bash
npm install
npm run dev
```

Open http://localhost:3000, log in with **any email + any password**, and land
in a fully seeded demo workspace: clients, projects, a task board, time
entries, invoices, a marketing calendar and the Kraft AI panel — all working,
all persistent, all local.
