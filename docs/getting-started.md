# Getting started

## Requirements

- Node.js 20+ (Node 22 recommended)
- npm (the repo uses npm lockfile)

Workspace data still runs on your machine (`mock-db.json`). Sign-in needs a
local env file and the local Cloudflare D1 database. See
[Authentication](./authentication.md) for the full setup.

## Install and run

```bash
npm install
cp .env.example .env.local
cp .env.example .dev.vars
# put the same BETTER_AUTH_SECRET (32+ characters) in both files
npm run db:migrate:local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If port 3000 is busy,
Next.js automatically picks the next free port (e.g. 3001) and tells you in
the terminal.

### Other commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Run the unit test suite (Vitest) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run storybook` | Component workshop at :6006 |
| `npm run clean` | Remove `.next` and the transform cache |

> **Tip:** don't run `npm run build` while `npm run dev` is running — they
> share the `.next` folder and the dev server will break. Stop one first, or
> use `npm run clean` and restart if it happens.

## Signing in

Go to `/auth/sign-up` and create an account. The password must be at least 8
characters. Sign-up opens a session immediately and starts the onboarding
wizard. The demo workspace (clients, projects, tasks, documents) is seeded on
that first signed-in request, keyed by the Better Auth user id.

| Flow | What happens |
|---|---|
| **Sign up** | Account is written to local D1. You walk through onboarding (profile → brand kit → first client), then land in the seeded workspace |
| **Log in** | Email and password are checked against D1. If onboarding is unfinished you return to the wizard; otherwise you land on the dashboard |
| **Continue with Google** | Not available. The button explains that |
| **Magic link** | Not available. The button explains that |
| **Forgot password** | In development the reset link is printed in the server log (`[auth] password reset …`). Open that URL to set a new password |

### Each account is its own workspace

The Better Auth user id is the owner key for mock rows. Signing up with a new
email creates a new workspace. Signing in again with the same email reuses it.

Sign out from the account menu (avatar, top right).

## Resetting the demo

All data lives in two gitignored folders at the repo root:

| Path | Contents |
|---|---|
| `mock-db.json` | The entire "database" — all accounts, all rows, 41 tables |
| `mock-storage/` | Uploaded files (brand logos, document attachments, receipts) |

To reset **everything**:

```bash
# stop the dev server first
rm -rf mock-db.json mock-storage
npm run dev
```

The workspace re-seeds itself the next time you sign in. That does not delete
the D1 user. To wipe local accounts and sessions as well, see
[Authentication → Resetting auth data](./authentication.md#resetting-auth-data).

To reset **one account**, sign in with a different email — or delete just
that account's data by editing `mock-db.json` (see
[Architecture](./architecture.md#the-data-file)).

## Optional environment variables

Auth requires `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` in `.env.local` and
`.dev.vars`. See [Authentication](./authentication.md#environment).

Two more are honoured if present:

| Variable | Effect when set |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Base URL used when building shareable links (invoice pay links, quote approval links). Defaults to a relative URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Enables the Google One Tap widget on the login page. Without it the widget does not render. "Continue with Google" is not a working sign-in method |
