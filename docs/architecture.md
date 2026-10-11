# Architecture

How this repo keeps the original app's code intact while running entirely on
your machine.

## The core idea: seams, not rewrites

The extracted app kept **every page, component, query module and server
action** from the original full-stack app. What changed is the layer beneath
them — the four thin seams every piece of app code goes through:

```
app code (unchanged)
   │
   │  import { createClient } from "@/lib/supabase/server"      ← seam
   │  import { createClient } from "@/lib/supabase/client"      ← seam
   │  import { createAdminClient } from "@/lib/supabase/admin"  ← seam
   │  import { getServerContext } from "@/lib/supabase/get-server-context" ← seam
   ▼
mock implementations (lib/mock/**)
   │
   ▼
mock-db.json · mock-storage/ · mock_session cookie · scripted AI stream
```

~107 `queries.ts` modules and 60+ server actions were **not touched** — they
still call `.from("tasks").select()...` and get the right answers, because
the mock client implements the same query-builder surface over a JSON file.

`@supabase/supabase-js` itself is never imported from node_modules at
runtime: a local shim at `lib/vendor/supabase-js.ts` is mapped over it via
`tsconfig.json` paths (and mirrored in the Vitest and Storybook configs).

## The data file

**`mock-db.json`** (gitignored, created on first use) is the entire database:

```jsonc
{
  "version": 1,
  "counter": 1000,            // monotonic row-id source
  "users": [ … ],             // one entry per account (email-keyed)
  "tables": {
    "clients":  [ /* rows */ ],
    "projects": [ /* rows */ ],
    …                          // 41 tables total
  }
}
```

- **Schema** — `lib/mock/schema.json` declares all 41 tables with columns,
  types, defaults and unique constraints, mirroring the original Supabase
  schema.
- **Reads/writes** — `lib/mock/db.ts` (row insert/update with defaults,
  coercion, unique checks, `updated_at` touch) and `lib/mock/query.ts` (a
  Supabase-compatible query builder: `select/insert/update/delete/range/
  order/eq/in/or/single/...`).
- **Persistence** — `lib/mock/store.ts` holds the DB on `globalThis` (one
  instance per server process) and writes the whole file on mutation.
  Every write is a full-file JSON write — fine for a demo, not for scale.

### The data file — key facts

| Fact | Value |
|---|---|
| Path | `mock-db.json` at the repo root (gitignored) |
| Tables | 41 (schema), ~34 populated per seeded account |
| Seeded per account | ~9 clients, ~10 projects, ~12 milestones, ~40 tasks, ~40 time entries, ~18 expenses, ~30 documents, ~47 line items, payments, recurring invoices + runs, services, document & project templates, notifications, follow-ups, client health snapshots, project digests, campaigns, posts, pins, AI threads + messages, API keys, MCP connections, document sequences |
| Isolation | Rows are scoped per `user_id`; accounts never see each other's data |

## Auth

`lib/mock/auth.ts` exposes the same `supabase-js` auth API
(`signInWithPassword`, `signUp`, `signInWithOtp`, `signInWithOAuth`,
`exchangeCodeForSession`, `verifyOtp`, `updateUser`, `signOut`, `getUser`,
`getClaims`…), backed by cookies instead of a provider:

- **`mock_session`** — the session: `encodeURIComponent(JSON { e: email,
  w: needsOnboarding, x: expiresAt })`, 7-day TTL. Readable from both client
  (`document.cookie`) and server (`cookies()` from `next/headers`).
- **`mock_pending_email`** — set by magic-link / OTP / OAuth requests, used
  by `/auth/confirm` to complete the flow.
- **User id** — derived deterministically from the email (FNV-1a → UUID
  shape), so the same email always maps to the same account.
- **Provisioning** — `ensureUser()` in `lib/mock/store.ts` lazily creates
  the account **and seeds its full demo workspace** on first sight.

There is no middleware: route protection happens in the app layout and in
`getServerContext()`, which read the cookie server-side.

## Storage

Files live under **`mock-storage/<bucket>/<path>`** (gitignored) and are
served by `app/storage/v1/object/public/[bucket]/[...path]`, so the URLs the
app hands out (`/storage/v1/object/public/brand-logos/...`) work exactly like
Supabase public buckets. `lib/mock/storage.ts` implements the storage-js
surface (`upload`, `download`, `remove`, `list`, `getPublicUrl`) with
matching return shapes. Buckets in use: `brand-logos`, `documents` (PDFs and
attachments), expense receipts, marketing media.

## The AI panel (Kraft)

- `app/api/ai/stream/route.ts` — the endpoint the panel posts to. Instead of
  calling Anthropic, it runs `lib/ai/mock-turn.ts`, which picks a scripted
  response based on the request (mode, agent, context record) and streams it
  as **Server-Sent Events in the real wire format** the frontend expects:
  `thread_created` → `route` → `token`… → structured payload → `done`.
- Turns persist to the `ai_threads` / `ai_messages` tables, so conversation
  history survives reloads.
- `app/api/ai/invalidate` (called by the unchanged
  `lib/assistant/invalidate-after-action`) refreshes the server caches an
  AI write would have affected — kept verbatim from production.

Because the wire format is real, the panel's streaming renderer, step trail,
tool chips, draft cards and confirm cards are all exercised for real.

## Billing, email, API keys, MCP

| Feature | Implementation |
|---|---|
| Checkout / plan change | `lib/billing/actions.ts` — updates the subscription + profile rows, logs `[mock-billing] …`, no LemonSqueezy call |
| Invoice history | Mock rows on the subscription; rendered identically |
| All outbound email | `lib/email/*.ts` — each `send*()` logs `[mock-email] …` to the server console and still performs the status side-effects the app expects |
| API keys | Real rows in `api_keys` (create/reveal/revoke all persist); no server authenticates them |
| MCP connections | Real rows in `mcp_connections`; the OAuth dance is stubbed |

## What was removed

- **Supabase** — database, auth provider, storage, realtime, edge functions
- **Anthropic model layer** — the whole model pipeline
- **MCP server** — the process and its `/api/mcp` route
- **LemonSqueezy** — checkout, webhooks, portal
- **Resend** — email delivery
- **Public client portal** — `/pay`, `/portal`, `/quote`, `/proposal`
  (public token pages) and the app middleware
- **API routes** for keys/entities — replaced by the mock-backed screens

## Known limitations

- **Public pages aren't included.** Invoice *Pay links* and quote/proposal
  *Approval links* are generated and copyable, but the tokenised public pages
  behind them (`/pay/[token]`, `/portal/[token]`, quote/proposal approval
  views) were part of the removed public portal and were never extracted.
  Demonstrating the payment flow end-to-end is done via the **mock payment
  modal** on the invoice instead.
- **Emails never arrive.** Magic-link, password-reset and transactional email
  screens render, but nothing is delivered — see
  [Getting started → Simulating the email links](./getting-started.md#simulating-the-email-links).
- **Support is a placeholder** screen.
- **The whole app is single-process.** The DB lives in memory and is flushed
  to disk on every write — two dev servers on one checkout would clobber each
  other.
- **No realtime.** Broadcast/presence channels from the original app have no
  transport; screens that used them fall back to polling/refresh.

## Extending the demo

- **Add/adjust seed data** — `lib/mock/seed.ts` builds one account's
  workspace. Edit the seed arrays (clients, projects, tasks, documents…),
  restart the dev server, and delete `mock-db.json` to re-seed.
- **Add a table** — add its schema to `lib/mock/schema.json`; the query
  builder picks it up automatically. Existing rows stay valid.
- **Change plans/limits** — `config/plans.ts` (tiers, prices, feature flags).
- **Change nav/shortcuts** — `config/nav.ts`, `config/command-palette.ts`,
  `config/mobile-nav.ts`, `components/layout/sidebar.tsx`.
- **Change branding** — `public/images/branding/**` and
  `config/branding.ts`; the in-app Brand kit (Settings) controls the *demo
  user's* brand, not the app chrome.
- **Script different AI behaviour** — `lib/ai/mock-turn.ts` (responses per
  agent) and `lib/ai/agents.ts` (agent roster + plan gating).
