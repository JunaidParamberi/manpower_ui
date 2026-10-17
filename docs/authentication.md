# Authentication

Email and password sign-in is [Better Auth](https://github.com/better-auth/better-auth) 1.7. Workspace data (clients, documents, projects, profiles) still lives in the mock store. Only identity — users, sessions, accounts, and verification tokens — is stored in Cloudflare D1 through Drizzle.

## What changed

| Before | Now |
|---|---|
| Any email and any password signed you in | Email and password are checked against D1 |
| Session was a readable `mock_session` cookie | Session is a Better Auth cookie (`better-auth.session_token`) |
| User id was a hash of the email | User id is the Better Auth user id |
| No middleware | `middleware.ts` redirects signed-out visitors to `/auth/login` |
| Google and magic link simulated a session | Those buttons stay on the form and report that the method is not available yet |

The app code that calls `supabase.auth.getUser()` and `getClaims()` was left in place. On the server, `lib/supabase/server.ts` reads the Better Auth session and hands that user to the mock client, then `ensureUser()` in `lib/mock/store.ts` creates or re-keys the demo workspace for that id. Client components that sign in, sign out, change a password, or change an email call `lib/auth-client.ts` directly.

## Layout

```
lib/auth.ts                 createAuth(db) — Better Auth factory
lib/auth.cli.ts             config the CLI loads to regenerate the Drizzle schema
lib/auth/request-user.ts    getRequestAuthUser() for the current request
lib/auth-client.ts          browser client (better-auth/react)
db/schema.ts                Drizzle tables: user, session, account, verification
db/index.ts                 getAuthDb() — D1 binding via OpenNext
drizzle/                    SQL migrations applied by Wrangler
app/api/auth/[...all]/      Better Auth HTTP handler
middleware.ts               cookie check + x-pathname header
wrangler.jsonc              D1 binding DB → manpower-auth
```

`createAuth` is built per request. The D1 binding is not available at module load or during `next build`, so nothing captures `env.DB` at import time. `lib/auth.cli.ts` exists only so `npm run auth:schema` can load a config without touching D1.

## D1 and Drizzle

D1 is SQLite. The adapter is `drizzleAdapter` with `provider: "sqlite"`. Table names stay singular (`user`, `session`, `account`, `verification`).

| | |
|---|---|
| Database name | `manpower-auth` |
| Binding | `DB` |
| Database id | `1f9e93ca-ed8b-4ce0-9d17-68892e9bf294` |
| Migrations | `drizzle/` (`migrations_dir` in `wrangler.jsonc`) |

Local `next dev` sees that binding because `next.config.ts` calls `initOpenNextCloudflareForDev` and points persistence at `.wrangler/state/v3`, the same directory `wrangler d1 migrations apply --local` writes.

### Commands

```bash
npm run auth:schema       # regenerate db/schema.ts from the Better Auth CLI
npm run db:generate       # write a new SQL file under drizzle/
npm run db:migrate:local  # apply drizzle/*.sql to local D1
npm run db:migrate:remote # apply the same SQL to the remote database
```

Use Wrangler as the only migrator. Do not also run `drizzle-kit migrate` — that would apply the same SQL twice.

After adding a Better Auth plugin, run `auth:schema`, then `db:generate`, then both migrate commands.

## Environment

Copy `.env.example` to `.env.local` and `.dev.vars`. Both files are gitignored. Next reads `.env.local`. Wrangler and the OpenNext dev proxy read `.dev.vars`. Use the same secret in both.

| Variable | Purpose |
|---|---|
| `BETTER_AUTH_SECRET` | Signs session cookies. At least 32 characters |
| `BETTER_AUTH_URL` | App origin. `http://localhost:3000` locally. The deployed origin in production |

Generate a secret with:

```bash
openssl rand -base64 32
```

Before `npm run deploy`, set the same names on the Worker (`wrangler secret put BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` as a var). The production URL must match the origin users actually open.

## Sign-in flows

Passwords must be at least 8 characters. Sign-up creates a session immediately (email verification is off) and sends the user to `/onboarding`. The first request seeds a demo workspace with onboarding still incomplete, so the wizard starts at profile.

| Screen | Client call |
|---|---|
| `/auth/login` | `authClient.signIn.email` |
| `/auth/sign-up` | `authClient.signUp.email` |
| `/auth/forgot-password` | `authClient.requestPasswordReset` |
| `/auth/update-password` | `authClient.resetPassword` (needs `?token=`) |
| Settings → password | `authClient.changePassword` |
| Settings → email | `authClient.changeEmail` |
| Sign out (account menu) | `authClient.signOut` |
| Delete account | `auth.api.deleteUser`, then the mock workspace is removed |

There is no mailer. In development, password-reset and email-change links are printed in the server log as `[auth] …`. In production those callbacks throw until a sender is configured, so the form shows an error instead of pretending an email was sent.

Google and magic link are not implemented. The buttons remain and set an inline error.

## Route protection

`middleware.ts` only checks that a Better Auth session cookie exists. That is a redirect hint, not proof of a valid session. Anyone can invent a cookie.

The real check is `auth.api.getSession` inside `getRequestAuthUser()`, which the server Supabase client runs on each request. App layouts and server actions still go through `getServerContext()` / `getProfile()`, and those now see the Better Auth user.

Public paths (no cookie required):

- `/auth/*`
- `/terms`, `/privacy`
- `/api/auth/*`
- `POST /api/invoices/pay`
- `/storage/*` (mock public files)

Other `/api/*` routes without a cookie get `401`. Everything else redirects to `/auth/login`, with `next` set to the path the user asked for. `/` with no cookie goes to login. The onboarding layout reads the `x-pathname` request header that middleware sets, so it can tell which wizard step you are on.

## Resetting auth data

Workspace rows are still in `mock-db.json`. Auth rows are in local D1 (`.wrangler/state/v3`).

To wipe the demo workspace, stop the dev server and delete `mock-db.json` and `mock-storage/` as before. The next signed-in request seeds a workspace for the Better Auth user id.

To wipe local accounts and sessions:

```bash
rm -rf .wrangler/state/v3/d1
npm run db:migrate:local
```

Remote D1 is a separate database. Resetting local state does not delete remote users.

## Not in this change

- Sign in with Google, magic links, and Sign in with Cloudflare
- Moving clients, documents, projects, or profiles into D1
- Sending password-reset or email-change mail
