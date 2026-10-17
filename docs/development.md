# Development

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run dev:clean` | Wipe caches, then dev server (fixes most "weird dev server" states) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next.js config) |
| `npm test` | Vitest — the full unit suite |
| `npm run test:watch` | Vitest in watch mode |
| `npm run clean` | Remove `.next` and `node_modules/.cache` |
| `npm run storybook` | Storybook dev server on :6006 |
| `npm run storybook:build` | Static Storybook build |
| `npm run auth:schema` | Regenerate `db/schema.ts` from Better Auth |
| `npm run db:generate` | Write a Drizzle SQL migration under `drizzle/` |
| `npm run db:migrate:local` | Apply D1 migrations to the local database |
| `npm run db:migrate:remote` | Apply D1 migrations to remote `manpower-auth` |
| `npm run preview` | OpenNext build, then `wrangler dev` |
| `npm run deploy` | OpenNext build, then `wrangler deploy` |

## Tests

```bash
npm test          # 1,713 tests across 189 files (1 pre-existing skip)
```

The suite is **pure logic** — no DOM, no network, no database. It covers the
things worth guarding: query builders, formatters, filters, reducers,
validation, URL-state parsing, document totals, kanban reordering, the mock
schema/seed invariants, and so on. Component behaviour is covered by
Storybook stories instead.

Layout:

- Co-located `*.test.ts` next to the code they test (e.g.
  `lib/documents/compute-document-totals.test.ts`)
- Story files `*.stories.tsx` next to components

Run a subset:

```bash
npx vitest run lib/documents        # by path
npx vitest run -t "totals"          # by test name
```

## Storybook

```bash
npm run storybook   # → http://localhost:6006
```

252 stories across `ui/` ( primitives), `features/` (product components) and
`layout/` (shell pieces). Stories are written to be *explanatory* — many
carry long descriptions of the component's contract. Use it to browse the
design system and to develop components in isolation; every story renders
against the mock seams, so no backend is needed.

## Project layout

```
app/
  (app)/          # the signed-in app: dashboard, tasks, time, clients,
                  #   projects, documents, finance, expenses, marketing,
                  #   services, settings, support
  (marketing)/    # /privacy, /terms
  auth/           # login, sign-up, forgot/update password, confirm, error
  onboarding/     # profile → brand → client wizard
  api/            # auth/[...all], ai/stream, ai/invalidate,
                  #   documents/[id]/pdf, account/export, invoices/pay
  storage/        # public-bucket file route for mock-storage/
components/
  ui/             # shadcn primitives
  features/       # product components, grouped by domain
  layout/         # shell: sidebar, header, command palette, mobile nav
  onboarding/     # wizard steps
  auth/           # auth form pieces
config/           # plans, nav, command palette, mobile nav, branding
lib/
  auth.ts         # Better Auth factory (D1 + Drizzle)
  auth-client.ts  # browser auth client
  auth/           # request session helper
  mock/           # workspace store: schema, db, query builder, seed
  supabase/       # seams: server / client / admin / get-server-context
  vendor/         # supabase-js shim (mapped via tsconfig paths)
  ai/             # mock turn scripter + agents
  <domain>/       # queries.ts + actions.ts per feature (unchanged app code)
docs/             # ← you are here
```

## Patterns used throughout

- **Server actions + `queries.ts` per domain.** Pages are React Server
  Components that call `listX()` / `getX()` from `lib/<domain>/queries.ts`;
  mutations go through `"use server"` actions in `lib/<domain>/actions.ts`
  that return `{ ok, ... } | { error }` result objects — never throw across
  the boundary.
- **`getServerContext()`** returns `{ user, profile, supabase }` for the
  current request; the four supabase seams are the only places that know a
  mock exists.
- **URL is state.** Filters, tabs, view modes (board/list, month/week, doc
  type) live in search params — shareable, reload-safe, back-button-safe.
- **Result-typed queries.** Query modules return `{ ok: true, rows } | {
  ok: false, error }`, so pages handle failure explicitly.
- **Design tokens, not raw colours.** Components style with CSS variables
  (`var(--bg-surface)`, `var(--fg-2)`, …) from the Tailwind 4 theme, so
  light/dark and rebranding work everywhere.

## Gotchas

- **Don't run `next build` while `next dev` is running.** They share
  `.next/`; the build wipes it out from under the dev server and every route
  starts returning 500. Stop the dev server first. If it happens:
  `npm run clean && npm run dev`.
- **Restart after editing the seed.** The DB is cached on `globalThis` for
  the life of the server process — edits to `lib/mock/seed.ts` only apply
  after a restart **and** deleting `mock-db.json`.
- **Every write flushes the whole DB file.** Fine for a demo; don't be
  surprised that `mock-db.json` rewrites on every mutation.
- **Port 3000 busy?** Next automatically uses the next free port and prints
  it. No config to change.
- **`@supabase/supabase-js` is a path alias.** If your editor complains about
  the import, that's the `tsconfig.json` `paths` entry pointing at
  `lib/vendor/supabase-js.ts` — intentional, and mirrored in
  `vitest.config.ts` and `.storybook/main.ts`.
- **Typecheck before pushing.** `npx tsc --noEmit` — the codebase is strict
  and the mock is fully typed against the original `types/` definitions.

## Verifying a change

```bash
npx tsc --noEmit     # types
npm test             # unit suite
npm run lint         # eslint
npm run build        # production build
```

All four should be green. For UI work, also spot-check the affected screens
in Storybook and click through them in the dev server — create, edit and
delete something, reload, and confirm it persisted (that's the whole point of
the mock layer).
