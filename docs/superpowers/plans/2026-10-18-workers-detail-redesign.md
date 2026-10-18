# Workers Detail Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/workers` look and behave like `/clients`: a list pane with lens chips and "Needs you" grouping, and a detail pane with an icon meta header, a 4-cell stat strip, underline tabs with counts, and an Overview tab built around a readiness card.

**Architecture:** All readiness logic (expiries, issues, groups, lenses, counts) lives in one pure, tested module `lib/workers/worker-readiness.ts` that takes `nowIso` as a parameter. UI components mirror their Clients counterparts one-for-one and import only from that module plus existing worker mutations. Tabs move to the Clients pattern: `<Link>`-based underline tabs driving `?tab=`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v4 with app tokens (`var(--fg-3)`, `var(--danger)` …), shadcn/base-ui components in `components/ui`, vitest.

**Spec:** Interactive mockup `.scratch-worker-header-mockup/preview.html` (published at https://claude.ai/artifact/TrcwXTLMFboASQE33ScqTr). Open it in a browser before starting; it is the visual reference. Reference implementation to copy structure and class names from: `components/features/clients/overview/*` and `components/features/clients/detail/*`.

## Global Constraints

- Today is computed once per render as `new Date().toISOString()` in client components and passed down as `nowIso`; pure functions never call `new Date()`.
- Day math uses `daysBetweenIso(fromIso, toIso)` from `lib/clients/health-facts.ts` (positive = `toIso` is in the future).
- "Expiring soon" threshold: `EXPIRING_SOON_DAYS = 30` (inclusive).
- Required document slots (count toward "Documents N / 9"): `passport_document`, `emirates_id_document`, `visa_document`, `photo`, `workmen_compensation_document`, `medical_insurance_card`, `noc_current_sponsor_document`, `noc_client_document`, `trade_license_document`. `_optional` slots never count.
- Use only existing color tokens; no literal hex colors in components.
- Copy is fixed by this plan where quoted; do not reword.
- No new database columns, tables or server actions. "Assign to client" opens `/workers/[id]/edit` (client links are already edited there).
- Do not commit `.scratch-worker-header-mockup/` or `lib/layout/nav-registry.ts` (that file has unrelated pending changes owned by the user).

## Review Focus

- A worker with every expiry and document empty (all seeded workers today): must render "—"/"Not uploaded" states, no `NaN`, no "Invalid Date", and show "Missing passport, Emirates ID, visa" in the readiness card. → test in Task 1.
- An expiry date that is today: counts as expiring in 0 days ("expires today"), not expired. → test in Task 1.
- Worker name that is a single word or has extra spaces (`"  Ali  "`): monogram is one letter, no crash. → test in Task 1.
- Search + lens combined with zero results: list shows "No workers match." with a working "Clear filters" that resets both `q` and `lens`. → manual check in Task 3.
- Old bookmarked URLs `?tab=details`: must land on About, not break. → test in Task 2.

---

### Task 0: Commit the split-pane groundwork

The split-pane (layout, shell, list pane, list card, default-worker page) is built but uncommitted.

**Files:** already on disk — `app/(app)/workers/layout.tsx`, `app/(app)/workers/page.tsx`, `app/(app)/workers/loading.tsx`, `components/features/workers/overview/*`, `components/features/workers/add-worker-button.tsx`, `components/features/workers/detail/worker-detail-view.tsx`, `lib/workers/active-worker.ts`.

- [ ] **Step 1: Verify**

Run: `npx tsc --noEmit && npx eslint "app/(app)/workers" components/features/workers lib/workers && npm test`
Expected: no type errors, no lint errors, all tests pass.

- [ ] **Step 2: Commit (only these files)**

```bash
git add "app/(app)/workers/layout.tsx" "app/(app)/workers/page.tsx" "app/(app)/workers/loading.tsx" components/features/workers/overview components/features/workers/add-worker-button.tsx components/features/workers/detail/worker-detail-view.tsx lib/workers/active-worker.ts
git commit -m "feat(workers): split-pane master-detail layout matching clients"
```

---

### Task 1: Readiness module

**Files:**
- Create: `lib/workers/worker-readiness.ts`
- Test: `lib/workers/worker-readiness.test.ts`

**Interfaces:**
- Consumes: `WorkerListRow` from `@/types`; `daysBetweenIso` from `@/lib/clients/health-facts`; `WorkerDocumentSlot`, `columnForSlot` from `@/lib/workers/worker-document-slots`.
- Produces:
  - `export const EXPIRING_SOON_DAYS = 30`
  - `export const REQUIRED_DOCUMENT_SLOTS: readonly WorkerDocumentSlot[]` (the 9 slots in Global Constraints, that order)
  - `export type WorkerExpiry = { kind: "passport" | "emirates_id" | "visa" | "medical" | "insurance"; label: string; date: string; daysLeft: number }` — labels: `"Passport"`, `"Emirates ID"`, `"Visa"`, `"Medical"`, `"Insurance"`; source columns `passport_expiry`, `emirates_id_expiry`, `visa_expiry`, `medical_expiry`, `insurance_expiry`
  - `export function workerExpiries(w: WorkerListRow, nowIso: string): WorkerExpiry[]` — only non-null dates, sorted by `daysLeft` ascending
  - `export function nextExpiry(w: WorkerListRow, nowIso: string): WorkerExpiry | null` — first entry of `workerExpiries` (may be negative = expired)
  - `export function uploadedRequiredCount(w: WorkerListRow): number` — count of `REQUIRED_DOCUMENT_SLOTS` whose column (`columnForSlot`) is a non-empty string on `w`
  - `export type WorkerIssue = { id: string; title: string; detail: string; tone: "danger" | "warning" }`
  - `export function workerIssues(w: WorkerListRow, nowIso: string): WorkerIssue[]`
  - `export type WorkerGroup = "needs-you" | "ready" | "inactive"`
  - `export function workerGroupOf(w: WorkerListRow, nowIso: string): WorkerGroup` — `inactive` if `status === "inactive"`; else `needs-you` if any issue; else `ready`
  - `export type WorkerLens = "all" | "needs-you" | "ready" | "deployed"`
  - `export const WORKER_LENSES: ReadonlyArray<{ id: WorkerLens; label: string }>` — `All`, `Needs you`, `Ready`, `Deployed`
  - `export const WORKER_GROUPS: ReadonlyArray<{ id: WorkerGroup; label: string }>` — `Needs you`, `Ready`, `Inactive`
  - `export function parseWorkerLens(v: string | null | undefined): WorkerLens` — unknown → `"all"`
  - `export function matchesWorkerLens(w: WorkerListRow, lens: WorkerLens, nowIso: string): boolean` — `deployed` matches `status === "deployed"`; `needs-you`/`ready` match `workerGroupOf`
  - `export function countWorkerLenses(ws: WorkerListRow[], nowIso: string): Record<WorkerLens, number>`
  - `export function workerMonogram(name: string): string` — first letter of first and last whitespace-separated word, uppercased; `"?"` for blank
  - Move `workerMonogram` out of `components/features/workers/overview/workers-list-card.tsx` and import it there.

`workerIssues` rules, in this output order (copy exact):
1. Each expiry with `daysLeft < 0`: `{ id: "expired-<kind>", title: "<Label> expired", detail: "Expired <n> day(s) ago. Renew it before the next site visit.", tone: "danger" }` (`n = -daysLeft`, "day" when 1).
2. Each expiry with `0 <= daysLeft <= 30`: title `"<Label> expires today"` when 0, else `"<Label> expires in <n> day(s)"`; detail `"Start the renewal now so the worker stays deployable."`; tone `"warning"`; id `"expiring-<kind>"`.
3. If any of `passport_document`, `emirates_id_document`, `visa_document` is missing: `{ id: "missing-ids", title: "Missing <list>", detail: "Needed for site access and the labour card.", tone: "warning" }` where list is the missing ones from `passport`, `Emirates ID`, `visa` joined `", "` (e.g. `"Missing passport, Emirates ID, visa"`).
4. If `!has_insurance`: `{ id: "no-insurance", title: "No medical insurance", detail: "Add an insurance card on the Documents tab.", tone: "warning" }`.

Test fixture: a `makeWorker(overrides: Partial<WorkerListRow>): WorkerListRow` helper in the test file with every nullable field `null`, booleans `false`, `status: "available"`, `supplier: null`, `clients: []`, `name: "Ibrahim Yusuf"`, `employee_id: "EMP/2026/0002"`, `created_at`/`updated_at` `"2026-10-01T00:00:00.000Z"`. `NOW = "2026-10-18T09:00:00.000Z"`.

- [ ] **Step 1: Write the failing tests** in `lib/workers/worker-readiness.test.ts`:
  - `workerExpiries` on empty worker → `[]`
  - `workerExpiries` with `visa_expiry: "2026-11-08"`, `passport_expiry: "2026-10-14"` → `[{kind:"passport", daysLeft:-4,…},{kind:"visa", daysLeft:21,…}]` (sorted)
  - `nextExpiry` on empty worker → `null`
  - `uploadedRequiredCount` with `passport_document_url: "x"`, `passport_document_optional_url: "y"`, `photo_url: "z"` → `2`
  - `workerIssues` on empty worker → exactly `[missing-ids ("Missing passport, Emirates ID, visa"), no-insurance]`
  - `workerIssues` with `emirates_id_expiry: "2026-10-18"` (today) → contains `{ id: "expiring-emirates_id", title: "Emirates ID expires today", tone: "warning" }` and no `expired-*`
  - `workerIssues` with `passport_expiry: "2026-10-17"` → first item `{ id: "expired-passport", title: "Passport expired", detail: "Expired 1 day ago. Renew it before the next site visit.", tone: "danger" }`
  - `workerIssues` with all three ID docs uploaded, `has_insurance: true`, no expiries → `[]`
  - `workerGroupOf`: `status: "inactive"` with issues → `"inactive"`; available with issues → `"needs-you"`; available, no issues → `"ready"`
  - `matchesWorkerLens`: `"deployed"` true only for `status: "deployed"`; `"all"` always true
  - `countWorkerLenses` on `[ready-available, needs-you-deployed, inactive]` → `{ all: 3, "needs-you": 1, ready: 1, deployed: 1 }`
  - `parseWorkerLens`: `"needs-you"` → `"needs-you"`; `"bogus"`, `null` → `"all"`
  - `workerMonogram`: `"Ibrahim Yusuf"` → `"IY"`; `"  Ali  "` → `"A"`; `"Juan Dela Cruz"` → `"JC"`; `""` → `"?"`

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run lib/workers/worker-readiness.test.ts`
Expected: FAIL, cannot resolve `./worker-readiness`.

- [ ] **Step 3: Implement** every export listed under Produces in `lib/workers/worker-readiness.ts`. Update `workers-list-card.tsx` to import `workerMonogram`.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run lib/workers/ && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add lib/workers/worker-readiness.ts lib/workers/worker-readiness.test.ts components/features/workers/overview/workers-list-card.tsx
git commit -m "feat(workers): readiness rules for expiries, issues and lenses"
```

---

### Task 2: Tab model

**Files:**
- Modify: `lib/workers/worker-tab.ts`
- Modify: `lib/workers/worker-tab.test.ts`

**Interfaces:**
- Produces: `WORKER_TABS = ["overview", "documents", "clients", "accommodation", "timesheets", "about"] as const`; `WorkerTab`; `parseWorkerTab(value)` — default `"overview"`; legacy `"details"` maps to `"about"`.

- [ ] **Step 1: Replace the test table** with: `overview→overview`, `documents→documents`, `clients→clients`, `accommodation→accommodation`, `timesheets→timesheets`, `about→about`, `details→about`, `["documents","about"]→documents`, `bogus→overview`, `undefined→overview`, `null→overview`.

- [ ] **Step 2: Run** `npx vitest run lib/workers/worker-tab.test.ts` — Expected: FAIL on the new cases.

- [ ] **Step 3: Implement** the new `WORKER_TABS` and `parseWorkerTab`. Change the `tab = "details"` default in `components/features/workers/detail/worker-detail.tsx` to `"overview"`. `worker-detail-view.tsx` will no longer type-check against `"details"` TabsContent values — leave it; Task 4 replaces that file. If `tsc` blocks the commit, change its `value="details"` to `value="about"` as a stopgap.

- [ ] **Step 4: Run** `npx vitest run lib/workers/ && npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/workers/worker-tab.ts lib/workers/worker-tab.test.ts components/features/workers/detail/worker-detail.tsx components/features/workers/detail/worker-detail-view.tsx
git commit -m "feat(workers): overview/clients/about tabs, details maps to about"
```

---

### Task 3: List pane — lenses, groups, row signals

Mirror `components/features/clients/overview/clients-list-pane.tsx` and `clients-list-card.tsx`.

**Files:**
- Create: `components/features/workers/overview/worker-lens-chips.tsx`
- Modify: `components/features/workers/overview/workers-list-pane.tsx`
- Modify: `components/features/workers/overview/workers-list-card.tsx`

**Interfaces:**
- Consumes: everything from Task 1.
- Produces: `WorkerLensChips({ lens, counts, onChange }: { lens: WorkerLens; counts: Record<WorkerLens, number>; onChange: (l: WorkerLens) => void })` — same markup/classes as `client-lens-chips.tsx`; the "Needs you" count is `text-[var(--danger)]` when > 0 and not selected.
- `WorkersListCard` props become `{ workers; selectedId; groups: boolean; nowIso: string; onClearFilters; onSelect }`.

- [ ] **Step 1: Pane header.** Subtitle reads `"<n> worker(s) · <d> deployed"` and, when `counts["needs-you"] > 0`, appends `" · <k> need you"` in `font-medium text-[var(--danger)]`. Add a disabled outline icon button before the add button: `Upload` icon, `aria-label="Import workers (coming soon)"`, `title="Worker import is coming soon"`.

- [ ] **Step 2: Lens in the URL.** `lens = parseWorkerLens(searchParams.get("lens"))`; `setParams({ q?, lens? })` writes/deletes `lens` (delete for `"all"`), same as clients. Filter: `matchesWorkerLens && workerMatchesQuery`. Render `<WorkerLensChips>` under the search box. `groups` prop = `lens === "all" && !query.trim()`. `nowIso` memoised once per mount.

- [ ] **Step 3: Grouped rows.** When `groups`, render `WORKER_GROUPS` sections with the sticky heading markup copied from `clients-list-card.tsx` (skip empty groups); else a flat list. Empty result keeps "No workers match." + "Clear filters", which must reset both `q` and `lens` (call `router.replace(pathname)`).

- [ ] **Step 4: Row content.** Subtitle `"<trade> · <supplier name>"` (drop missing parts; fallback `employee_id`). Replace the status `Badge` with a right-aligned column: top line (only when relevant) `"<Label> expired"` in `text-[var(--danger)] font-medium`, or `"<Label> · <n>d"` in `text-[var(--warning)] font-medium` when `nextExpiry` is 0–30 days; bottom line a 7px dot + status label in `text-meta text-[var(--fg-2)]`. Dot colors: deployed `var(--primary)`, available `var(--success)`, on_leave `var(--warning)`, inactive `var(--fg-3)`. Add the same `⋯` dropdown as clients rows with items `Open`, `Edit`, separator, `Delete` (Delete opens `DeleteWorkerButton` — see Task 4 for its new controlled props; if Task 4 isn't done yet, omit Delete here and add it in Task 4).

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npx eslint components/features/workers` — Expected: clean.
Manual (`npm run dev`, log in with any email/password, open `/workers`): chips show counts; "Needs you" filters; typing `zzz` with lens "Ready" then "Clear filters" restores all workers and removes `?q`/`?lens` from the URL; groups visible only with All + empty search.

- [ ] **Step 6: Commit**

```bash
git add components/features/workers/overview
git commit -m "feat(workers): lens chips, needs-you grouping and expiry signals in list"
```

---

### Task 4: Detail header, stat strip and tabs bar

Mirror `client-detail-header.tsx`, `client-money-strip.tsx`, `client-detail-tabs.tsx`.

**Files:**
- Create: `components/features/workers/detail/worker-detail-header.tsx`
- Create: `components/features/workers/detail/worker-stat-strip.tsx`
- Create: `components/features/workers/detail/worker-detail-tabs.tsx`
- Modify: `components/features/workers/delete-worker-button.tsx`

**Interfaces:**
- Consumes: Task 1 exports; `WorkerTab`, `WORKER_TABS` from Task 2; `updateWorkerStatus(id, status)`; `WORKER_STATUSES`, `WORKER_STATUS_LABELS` from `@/lib/validations/worker`.
- Produces:
  - `DeleteWorkerButton({ workerId, workerName, open?, onOpenChange?, hideTrigger? })` — controlled mode exactly like `DeleteClientButton`; existing uncontrolled usage keeps working.
  - `WorkerDetailHeader({ worker, nowIso }: { worker: WorkerListRow; nowIso: string })`
  - `buildWorkerStatCells(worker: WorkerListRow, nowIso: string): { label: string; value: string; sub: string; tone?: "danger" | "warning" }[]` (exported for testing) and `WorkerStatStrip({ worker, nowIso })`
  - `WorkerDetailTabs({ tab, counts }: { tab: WorkerTab; counts: Partial<Record<WorkerTab, number>> })`

- [ ] **Step 1: Failing test** `components/features/workers/detail/worker-stat-strip.test.ts` for `buildWorkerStatCells` (use a local `makeWorker` like Task 1's):
  - empty worker → `[{label:"Documents", value:"0 / 9", sub:"9 missing", tone:"warning"}, {label:"Next expiry", value:"—", sub:"no expiry dates entered"}, {label:"Clients", value:"0 linked", sub:"not assigned"}, {label:"Medical", value:"Not fit", sub:"no insurance", tone:"warning"}]`
  - `passport_expiry` 4 days ago → Next expiry `{ value: "Passport", sub: "expired 4 days ago", tone: "danger" }`
  - `visa_expiry` in 21 days → `{ value: "21 days", sub: "Visa", tone: "warning" }`; in 200 days → `{ value: "200 days", sub: "Visa" }` (no tone)
  - all 9 required uploaded → Documents `{ value: "9 / 9", sub: "all on file" }` (no tone)
  - one client, `medical_fit: true`, `has_insurance: true` → Clients `{ value: "1 linked", sub: "on site" }`, Medical `{ value: "Fit", sub: "insured" }`

  Run `npx vitest run components/features/workers` — Expected: FAIL. Implement `buildWorkerStatCells`; rerun — PASS. (Tone `warning` on Documents when fewer than 3 required uploaded.)

- [ ] **Step 2: Strip markup.** `WorkerStatStrip` copies `ClientMoneyStrip`'s `<dl>` markup and border logic verbatim; `tone` danger → `text-[var(--danger)]`, warning → `text-[var(--warning)]` on the sub line.

- [ ] **Step 3: Header.** Copy `ClientDetailHeader` structure (mobile back link to `/workers` labelled "Workers", 40px monogram tile, name `h2`, pill row, meta row with `MetaItem`). Pills: status pill is a `Select` trigger styled as a pill (`PILL` class + tone: deployed `bg-[var(--accent-soft)] text-primary`, available `bg-[var(--success-soft)] text-[var(--success)]`, on_leave `bg-[var(--warning-soft)] text-[var(--warning)]`, inactive `bg-[var(--bg-subtle)] text-[var(--fg-2)]`); on change call `updateWorkerStatus` in a transition, toast the error, `router.refresh()` — move that logic from the current `worker-detail-view.tsx`. Second pill: `"Ready to deploy"` (success tones) when `workerIssues` is empty, else `"<n> issue(s)"` (danger tones if any issue is danger, else warning). Meta items with lucide icons: `IdCard` employee_id, `HardHat` trade_category, `Flag` nationality, `Truck` supplier name, `CalendarDays` `"Joined <Mon YYYY>"` from `created_at` (reuse `formatClientSince` from `@/lib/clients/display`). Skip null items. Actions: outline `Upload document` (`Upload` icon) linking to `?tab=documents`; primary `Assign to client` (`Plus`) linking to `/workers/<id>/edit`; ghost icon `⋯` dropdown with `Edit worker` (`Pencil`, link to edit) and destructive `Delete` opening the controlled `DeleteWorkerButton`. No Kraft button (no worker help exists).

- [ ] **Step 4: Tabs bar.** Copy `ClientDetailTabs` verbatim, swapping `CLIENT_TABS` → `WORKER_TABS`, `aria-label="Worker sections"`, and labels `Overview`, `Documents`, `Clients`, `Accommodation`, `Timesheets`, `About`. `overview` deletes `?tab`.

- [ ] **Step 5: Verify** `npx vitest run components/features/workers && npx tsc --noEmit && npx eslint components/features/workers` — Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add components/features/workers/detail components/features/workers/delete-worker-button.tsx
git commit -m "feat(workers): clients-style detail header, stat strip and tabs"
```

---

### Task 5: Overview and Clients tabs, wire the detail view

**Files:**
- Create: `components/features/workers/detail/worker-readiness-panel.tsx`
- Create: `components/features/workers/detail/worker-overview.tsx`
- Create: `components/features/workers/detail/worker-clients-section.tsx`
- Rewrite: `components/features/workers/detail/worker-detail-view.tsx`

**Interfaces:**
- Consumes: Tasks 1–4; `ClientSection`, `ClientSectionEmpty`, `SECTION_LINK` from `@/components/features/clients/detail/client-section` (reuse, do not copy); existing `WorkerDocumentsTab`, `WorkerDetailsTab`, `WorkerAccommodationTab`, `WorkerTimesheetsTab`.
- Produces: `WorkerDetailView({ worker, tab }: { worker: WorkerListRow; tab: WorkerTab })` (same props as today, so `worker-detail.tsx` is unchanged).

- [ ] **Step 1: Readiness panel.** Card markup copied from `client-health-panel.tsx` (bordered `rounded-xl`, header row, bullet list rows, footer). Header: a 28px circle with a 2px border in `var(--danger)` / `var(--warning)` / `var(--success)` (worst issue tone, or success when none) showing the issue count (or a `Check` icon when 0); title `"Needs attention"` or `"Ready to deploy"`. When issues exist, a small primary button `"Upload documents"` linking to `?tab=documents`. Rows: one per `WorkerIssue` (title medium, detail `text-[var(--fg-3)]`); with no issues a single row "All required documents on file" / "Nothing expires in the next 30 days.". Footer left: `"Checked today"`. No numeric score.

- [ ] **Step 2: Overview.** `WorkerOverview({ worker, nowIso })`: readiness panel inside `px-4 pt-5 sm:px-6 lg:px-7`, then a two-column grid (`grid gap-x-10 lg:grid-cols-2`, stack below lg) of:
  - `ClientSection title="Client sites" count={worker.clients.length}` action `View all` → `?tab=clients`; rows: monogram tile + client name; empty: `"Not on any client site. "` + link `"Assign to client"` → `/workers/<id>/edit`.
  - `ClientSection title="Expiries" count={expiries.length}` action `View all` → `?tab=about`; rows: 2-letter tile, label, sub `"Expired"`/`"Valid"`, pill `Expired` (danger) or `Due soon` (warning, ≤30d), right `"<n>d ago"` / `"in <n>d"`; empty: `"No expiry dates entered. "` + `"Add details"` → `/workers/<id>/edit`.

- [ ] **Step 3: Clients tab.** `WorkerClientsSection({ worker })`: same rows as the Overview "Client sites" section, title "Client sites", action `"Assign to client"` → edit page, empty `"Not linked to any project client yet."`.

- [ ] **Step 4: Rewrite `WorkerDetailView`** to mirror `ClientDetailView`'s frame: outer `flex min-h-0 min-w-0 flex-1 flex-col`; `WorkerDetailHeader`; `WorkerStatStrip`; `WorkerDetailTabs` with counts `{ documents: uploadedRequiredCount(worker), clients: worker.clients.length }`; scroll body `flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain` rendering by tab: overview → `WorkerOverview`; documents → `WorkerDocumentsTab`; clients → `WorkerClientsSection`; accommodation / timesheets → existing stubs; about → `WorkerDetailsTab`. Non-overview tabs sit in `px-4 py-5 sm:px-6 lg:px-7`. `nowIso` via `useMemo(() => new Date().toISOString(), [])`. Remove the old shadcn `Tabs`, the side status `Select`, and the Edit/Delete buttons (now in the header).

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npx eslint "app/(app)/workers" components/features/workers lib/workers && npm test`
Expected: all clean.
Manual on `/workers`: header matches the mockup's Proposed view; changing status via the pill updates the list dot after refresh; every tab renders; `/workers/<id>?tab=details` opens About; "Upload documents" goes to Documents; Delete in ⋯ opens the confirm dialog; at 400px wide the list shows first, picking a worker shows the detail with a "Workers" back link, and the stat strip wraps to 2×2.

- [ ] **Step 6: Commit**

```bash
git add components/features/workers/detail
git commit -m "feat(workers): overview readiness panel, client sites and expiries"
```
