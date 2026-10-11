# Getting started

## Requirements

- Node.js 20+ (Node 22 recommended)
- npm (the repo uses npm lockfile)

No database, no API keys, no `.env` file. There is no external service to
configure — everything runs on your machine.

## Install and run

```bash
npm install
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

Go to `/auth/login`. **Any email address and any password work** — there is
no credential checking. What you get depends on how you enter:

| Flow | What happens |
|---|---|
| **Log in** (any email) | You get a fully seeded demo workspace: ~9 clients, ~10 projects, ~40 tasks, time entries, ~30 documents (invoices, quotes, proposals, receipts, LPOs), expenses, recurring invoices, a marketing calendar with campaigns and posts, notifications and previous Kraft conversations |
| **Sign up** (a fresh email) | You walk through the 3-step onboarding wizard (profile → brand kit → first client), watch the "setting up your workspace" ceremony, then land in the same seeded workspace |
| **Continue with Google** | Simulated — signs you in immediately as a demo Google account, no consent screen |
| **Magic link** | Shows the real "check your email" screen; no email is sent (see below) |
| **Forgot password** | Same — shows the "check your email" screen; no email is sent |

### Simulating the email links

Since no email provider is wired, the magic-link / password-reset screens are
dead ends by design. If you want to walk the full flow anyway, the email
links are just URLs:

1. On the login page, switch to the **magic link** tab, enter your email and
   click **Send magic link**. The app shows "Check your email".
2. The link a real email would contain is:

   ```
   http://localhost:3000/auth/confirm?code=anything&next=/dashboard
   ```

   Opening it completes the sign-in for the email you requested the link for.

For a password reset, the equivalent is:

```
http://localhost:3000/auth/confirm?token_hash=anything&type=recovery&next=/auth/update-password
```

…which lands you on the update-password screen.

### Each email is its own workspace

Accounts are keyed by email address (case-insensitive). Every new email you
sign in with gets its own full copy of the demo data. Your user id is derived
deterministically from the email, so the same email always maps to the same
account and data.

Sessions live in a `mock_session` cookie and last **7 days**. Sign out from
the account menu (avatar, top right).

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

The workspace re-seeds itself the next time you sign in.

To reset **one account**, sign in with a different email — or delete just
that account's data by editing `mock-db.json` (see
[Architecture](./architecture.md#the-data-file)).

## Optional environment variables

None are required. Two are honoured if present:

| Variable | Effect when set |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Base URL used when building shareable links (invoice pay links, quote approval links). Defaults to a relative URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Enables the real Google One Tap widget on the login page. Without it the widget simply doesn't render; the simulated "Continue with Google" button still works |

Everything else (billing variants, Supabase keys, Anthropic keys, Resend
keys) was removed with the backends.
