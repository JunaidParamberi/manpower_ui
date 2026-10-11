# Manpower — UI

The complete **Manpower** workspace front end — CRM, projects, tasks, time
tracking, expenses, documents, marketing, billing settings and the AI panel —
running **100% on the client machine**. No Supabase, no model, no billing
provider, no email service: every screen is here, fully navigable, and every
create / edit / delete persists locally.

Extracted from the full-stack app into a self-contained UI build.

## Documentation

Full docs live in [`docs/`](docs/README.md):

- **[Getting started](docs/getting-started.md)** — install, run, sign in, reset the demo
- **[User guide](docs/user-guide.md)** — every screen, panel and shortcut
- **[Architecture](docs/architecture.md)** — how the mock layer works, and how to extend it
- **[Development](docs/development.md)** — scripts, tests, Storybook, patterns

## Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **UI:** Tailwind CSS 4, shadcn/ui (Base preset)
- **Data:** local mock layer (`lib/mock/**`) persisted to disk
- **Package manager:** npm

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables
required — there is no external service to configure.

### Sign in

Any email + password works:

- **Sign up** with a fresh email → onboarding wizard → empty workspace.
- **Log in** with any email → a fully seeded demo workspace (clients,
  projects, tasks, time entries, invoices, documents, marketing calendar…).

Google / magic-link / OTP flows are simulated: they behave the same way they
do in the real app (including redirects and verification links), just without
a provider behind them.

## How the mock works

| Concern | Where | What it does |
|---|---|---|
| Database | `lib/mock/**` + `mock-db.json` | Supabase-compatible query builder over a JSON file, seeded on first use (41 tables) |
| Auth | `lib/mock/auth.ts` + `mock_session` cookie | Same API surface as supabase-js auth; session cookie readable on both client and server |
| Storage | `mock-storage/**` + `/storage/v1/object/public/…` route | Files on disk served back as public URLs |
| AI panel | `app/api/ai/stream/route.ts` + `lib/ai/mock-turn.ts` | Streams scripted SSE turns in the real wire format; conversations persist like everything else |
| Billing / API keys / MCP | `settings/billing`, `settings/api` | Mock-backed screens — the flows work, nothing calls out |

The app's own query modules (`lib/**/queries.ts`) and server actions are
untouched: they call `createClient()` / `createAdminClient()` from
`lib/supabase/*`, which are thin seams over the mock client.

`mock-db.json` and `mock-storage/` are gitignored and regenerate on demand —
delete them to reset the demo.

## Scripts

| Command               | Description                          |
|-----------------------|--------------------------------------|
| `npm run dev`         | Development server                   |
| `npm run build`       | Production build                     |
| `npm run start`       | Serve production build               |
| `npm run lint`        | ESLint (Next.js config)              |
| `npm test`            | Vitest (pure-logic unit tests)       |
| `npm run storybook`   | Component workshop                   |
| `npm run storybook:build` | Build static Storybook           |

## What was removed

All backends: Supabase (DB/auth/storage/realtime/edge functions), the
Anthropic model layer, the MCP server, LemonSqueezy billing, Resend email,
API routes for keys/entities, and the middleware. Nothing here phones home.
