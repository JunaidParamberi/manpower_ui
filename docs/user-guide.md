# User guide

A tour of every screen in Manpower. All data shown is the seeded demo
workspace; everything you change persists locally (see
[Getting started → Resetting](./getting-started.md#resetting-the-demo)).

---

## 1. The shell — sidebar, header, mobile

### Sidebar (desktop)

The left rail groups every destination:

- **Home** — Dashboard, Tasks (with a live open-task count), Time
- **Work** — Clients, Projects, Documents (expandable: Invoices, Quotes,
  Proposals, Receipts, Purchase orders), Services, Marketing
- **Money** — Finance, Expenses
- **Pinned** — anything you pin from a project, client, document or task row
  appears here with its own colour-coded icon
- **Bottom** — Settings, and **Customize navigation** (see below)

The rail can be collapsed to icons with the toggle in the top-left of the
header. When collapsed, clicking a top-level item opens a flyout with its
sub-items (e.g. Documents → Invoices/Quotes/…).

**Customize navigation** puts the sidebar into edit mode: you can reorder
items and hide ones you don't use. The layout persists per account (stored in
the `nav_layouts` table).

### Header

- **Breadcrumb** — current section › page, derived from the route
- **Search pill** — opens the command palette (⌘K)
- **Notification bell** — opens the notifications sheet; badge shows the
  unread count
- **Avatar menu** — current plan badge, links to Billing, Settings and
  Support, the **theme switcher** (Light / Dark / System), and **Sign out**

### Mobile

A bottom tab bar shows Dashboard, Projects, Clients, Finance and **More**.
"More" opens a sheet with the rest (Documents, Marketing, Expenses, Time,
Tasks, Settings, Support, Sign out).

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| **⌘K / Ctrl+K** | Open the command palette |
| **⌘J / Ctrl+J** | Toggle the Kraft AI panel |

### Command palette

⌘K opens a palette with three groups:

- **Suggested** — Dashboard, Tasks, Finance
- **Go to** — Clients, Projects, Documents, Expenses, Time, Settings
- **Create** — New invoice, New project, New client, New expense

Start typing to search across your clients, projects and documents (results
stream in after a short debounce) plus your pinned items and recent pages.

---

## 2. Dashboard (`/dashboard`)

The home screen answers "what needs me today?":

- **Greeting header** — time-aware greeting with a one-line summary of what's
  outstanding ("3 documents need you · 2 invoices overdue", or "All clear
  today.")
- **Needs you** — the action queue: unsent draft documents, overdue invoices,
  quotes that have gone quiet, payments that landed. Each row has a one-click
  action (e.g. "Open draft" opens a compose sheet with a suggested subject).
  Items can be **snoozed** — they disappear and come back later.
- **Revenue** — a rolling revenue chart
- **Today's brief** — an auto-generated narrative summary of your workspace
  (marked with the AI icon)
- **Active work** / **Documents in flight** — what's moving, toggleable
- **Clients** — health snapshot strip
- **Activity** — a feed of recent changes

**Customize** (button next to "Needs you") enters an edit mode where cards
can be reordered and hidden. The layout persists per account
(`dashboard_layouts` table).

---

## 3. Tasks (`/tasks`)

Two views, toggled in the toolbar:

- **Board** (default) — a Kanban board with To do / In progress / Done
  columns. Drag cards between columns to change status; drag within a column
  to reorder.
- **List** — a dense table with inline expand, per-row quick actions and
  sorting.

**Filters** (all reflected in the URL, so views are shareable and survive
reload):

- Status — All / To do / In progress / Done / Cancelled
- Priority — All / High / Medium / Low
- Project — All projects, or a specific one
- Sort — Due date / Created / Priority

Also: a search box, a **summary strip** (counts by status), and a **+ New
task** composer at the top of the list. Clicking a task opens the **edit
sheet** (title, description, project, milestone, priority, due date,
assignee, estimated time). Tasks can be **pinned** from the row menu — pinned
tasks appear in the sidebar's Pinned section.

## 4. Time (`/time`)

The time tracker:

- **Start the timer** — pick a project (and optionally a task), add a note,
  press Start. The running entry shows a live elapsed clock; you can
  **pause / resume / stop**, and edit the running note inline.
- **Log manually** — the manual entry form below (project, task, date,
  duration) for time you forgot to track.
- **Entries list** — every entry with its project, task, duration and
  billable state. Entries for unbilled project time are tagged **Billable**.
- **Billing bar** — totals for the selected range: billable vs non-billable,
  estimated value.
- **Import time sheet** — bulk-import entries from a sheet.

Changes appear on the project's Time tab and in project profitability.

---

## 5. Clients (`/clients`)

- **List** — searchable table of all clients with health/status columns.
  **+ New client** opens the create form.
- **Client detail** (`/clients/[id]`) has five tabs:
  - **Overview** — contact block, health panel (score + band), open work,
    recent documents, a pinned note
  - **Projects** — that client's projects; **+ New project** prefilled
  - **Documents** — their invoices, quotes, proposals, receipts, LPOs
  - **Activity** — full history of what happened with this client
  - **About** — editable fields, addresses, tax numbers, custom notes

Pin a client from its card to keep it in the sidebar. The detail header also
has a **Kraft** helper ("Ask Kraft about this client"), which opens the AI
panel pre-loaded with this record's context.

---

## 6. Projects (`/projects`)

- **List** — cards/rows of projects with progress, budget burn, health and
  due dates. Pin, edit or delete from the card menu. **Templates** link opens
  `/projects/templates` — reusable project blueprints (milestones + tasks)
  you can instantiate into new projects.
- **Project detail** (`/projects/[id]`) is a workspace with a focus header
  (title, client, health, progress) and five tabs:
  - **Tasks** — the same board/list engine scoped to this project
  - **Timeline** — milestones and gantt-style scheduling
  - **Documents** — documents attached to the project
  - **Time** — logged time and billable totals for the project
  - **Expenses** — project expenses with add/delete

A **Kraft nudge** on the project suggests AI actions (e.g. draft a status
update) using the project's real data.

---

## 7. Documents (`/documents`)

A master–detail layout: a list pane on the left, the document workspace on
the right. The type switcher filters by **Invoices, Quotes, Proposals,
Receipts, Purchase orders** (also reachable directly via
`/documents/invoices`, `/documents/quotes`, etc.).

### Creating

**+ New document** (`/documents/new`) lets you start from one of your
**document templates** or from blank, optionally prefilled with a client and
project. The editor supports:

- Rich-text content blocks (Tiptap)
- **Line items** with qty, unit price, discount and per-item tax
- Totals, tax modes (e.g. VAT %), currency, payment terms
- Numbering that auto-increments per document type (INV-0001, Q-0001, …)

### Status lifecycle

`draft → sent → viewed → signed/approved → paid` (plus `partially_paid`,
`declined`, `written_off`, `voided`, `archived`). Status transitions are
driven by the actions below and recorded in the document's audit log.

### What you can do with a document

- **Send** — simulate sending by email (the email is logged to the server
  console as `[mock-email]`; the document status becomes *sent*)
- **Mark paid** — opens the payment modal; records a payment row and moves
  the invoice to *paid*
- **Void** — sets status *voided*; voided documents become read-only
- **Download PDF** — renders a real PDF server-side and downloads it
- **Save as template** — saves the current document as a reusable template
- **Convert quote → project** — one click turns an approved quote into a
  project with tasks
- **Approval link** (quotes/proposals) — copies a client-approval URL
- **Pay link** (invoices) — copies a client payment URL. *(The public
  client-facing pages behind these links are not part of this UI build — see
  [Known limitations](./architecture.md#known-limitations). The links are
  generated and copyable; the mock payment modal demonstrates the flow.)*
- **Recurring** — invoices can be marked recurring (interval + occurrences);
  the schedule shows in the Recurring section and on `/finance/recurring`
- **LPO flow** — local purchase orders have their own send/acknowledge path

Every document detail page also shows **payment history**, the **audit log**,
and an **activity rail**.

---

## 8. Finance (`/finance`)

The money overview:

- **Summary cards** — Revenue, Outstanding, Overdue, Average pay time
- **Revenue trend** — area chart over the selected period
- **Invoice table** — all invoices with status chips, sortable and filterable
- **+ New document** shortcuts (invoice/quote) from the toolbar
- **CSV export** of the current view

**Recurring invoices** live at `/finance/recurring`: list, create
(`/finance/recurring/new`) and inspect runs (`/finance/recurring/[id]`).

## 9. Expenses (`/expenses`)

- **Summary card** — spend by period/category
- **List** — date, vendor, category, amount, project (if any), receipt
- **+ New expense** opens a form sheet (fields: vendor, category, amount,
  date, project, note, receipt upload — uploads go to local storage and are
  served back through the mock storage route)
- **Delete** asks for confirmation

Project expenses also appear on the project's Expenses tab.

## 10. Marketing (`/marketing`)

A content calendar:

- **Views** — Month, Week, Agenda (switch in the filter bar)
- **Period navigation** — prev/next with the period label; all filter state
  lives in the URL, so a filtered calendar is a shareable link
- **Filters** — client, platform (Instagram/LinkedIn/…), status
- **Campaigns** — named campaigns with goals, cadence (posts/week) and date
  ranges; shown as colour-coded bars with a legend
- **Posts** — chips on calendar days; drag from the **unscheduled rail** on
  the left onto a day to schedule, or click a day to create. Click a post to
  open its dialog (title, platform, campaign, status, caption, media)
- **Summary strip** — counts of scheduled/drafted/published posts

## 11. Services (`/services`)

Your catalogue of services and products: name, type (service/product), unit,
rate and quantity on hand. These are offered as line-item presets when
building documents.

---

## 12. Settings (`/settings`)

`/settings` redirects to `/settings/profile`. Tabs:

### Profile
Display name and company name — used across documents and emails.

### Brand kit
Logo upload (stored in local mock storage, served at a stable URL), brand
colours, font and email signature. Used to brand generated documents.

### Billing & plan
- Current plan card (seeded accounts are on **Pro**)
- Plan cards for **Free / Starter / Pro / Agency** (prices in AED) —
  **Upgrade/Downgrade** switches the plan instantly; the checkout is mocked
  and logs `[mock-billing] …` to the server console. "Manage billing portal"
  just returns you here
- Usage bars (clients, documents, AI agents against plan limits)
- Invoice history for the mock subscription
- A test-mode banner reminding you no real payment happens

Plan tier is live: it gates which Kraft agents are available and whether the
API section appears (Pro+).

### API & integrations (Pro+)
- **MCP connect panel** — copy-paste instructions for connecting Claude as a
  custom connector, with a copyable connector URL
- **API keys manager** — create keys (shown once), list with prefix + last
  used, revoke
- **Developer docs** at `/settings/api/docs` (Pro+ only; redirect to the API
  page otherwise)

All mock-backed: keys are real rows in the local DB, but no server actually
authenticates them.

### Account
- **Sessions** — list active sessions and sign out others
- **Export data** — download your entire workspace as **JSON**, **CSV** (zip
  of per-table CSVs) or **PDF**, via `/api/account/export`
- **Delete account** — confirmation-gated deletion of the account and its
  data

### Legal & privacy
Cookie preference toggles, links to the Privacy policy and Terms pages
(`/privacy`, `/terms`), and a **consent log** of your choices.

### Notifications
Email notification preferences (per event type). Saving updates the profile
rows; no email is ever sent.

---

## 13. Kraft — the AI panel

Kraft is the assistant docked at the bottom centre of the screen (a small
island/pill). Press **⌘J** or click it to open.

### Modes

- **Ask** — read-only. Answers questions about your data ("Which invoices are
  overdue?", "Summarise this client") but never changes anything
- **Agent** — read **and write**. Can create and modify records; before a
  write lands it shows a **confirm card** you must approve

### Specialists

Kraft routes to specialist agents depending on your plan:

| Plan | Agents |
|---|---|
| Free | Router, Document Writer |
| Starter | + Finance Analyst, Communication Drafter, Content Marketer, Project Intelligence, Relationship Manager |
| Pro / Agency | + Pricing Advisor, Business Strategist |

### What a conversation looks like

- Ask anything in the composer; the reply **streams token-by-token** exactly
  like a real model (it's a scripted stream on the same SSE wire format)
- A **step trail** shows the agent's "thinking" steps and tool calls
- Structured results render as rich cards: **email drafts** (with subject +
  body, ready to "send"), **document drafts** (line items you can apply),
  **content drafts** (captions + hashtags), **relationship reads** (client
  health insights) and **action confirms**
- "Generate with AI" buttons inside forms (e.g. document editor, campaign
  dialog) open the panel pre-loaded with that record's context

### Panel features

- **Dock / pop out** — dock to the right rail, or float it as a draggable,
  resizable window (drag the edges; double-click resets position)
- **Minimise / close**
- **Mute** — silences the panel's sound effects (assets in `public/sounds`)
- **New session** — starts a fresh conversation
- **Thread history** — every conversation is persisted (in `ai_threads` /
  `ai_messages`) and reloadable

### Context-aware entry points

On client and project pages, the header's "Ask Kraft" buttons open the panel
pre-scoped to that record. After any AI-driven change, the app calls
`/api/ai/invalidate` to refresh affected server caches — same as production.

---

## 14. Onboarding (new sign-ups)

Signing up with a fresh email starts the wizard at `/onboarding`:

1. **Profile** — name, company
2. **Brand kit** — logo, colours, signature (skippable)
3. **First client** — add your first client (skippable)

Finishing triggers the full-screen **setup ceremony** (Creating your
workspace → … → You're all set), then drops you into the app with the seeded
demo workspace.

If you sign out mid-wizard, signing back in resumes at the first incomplete
step — app routes redirect you there automatically.

---

## 15. Marketing pages

`/privacy` and `/terms` are static policy pages reachable from Settings →
Legal and from the footer of auth screens. The public client portal pages
(portal, pay, quote approval) are **not** part of this build — see
[Known limitations](./architecture.md#known-limitations).

## 16. Support (`/support`)

A placeholder section — the screen exists and renders, but has no content or
ticket flow (the helpdesk backend was removed with everything else).
