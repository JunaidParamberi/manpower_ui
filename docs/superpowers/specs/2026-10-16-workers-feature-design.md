# Workers feature — design spec

Date: 2026-10-16

## Purpose

This repo (`manpower_ui`) is becoming the front end for a labor-supply /
manpower management product (reference: "ManpowerHub", modules include
Employee Master, Supplier Directory, Client Onboarding, Camp Management).
It currently ships an unrelated freelance-agency CRM demo (Clients,
Projects, Invoices, Time, Expenses). That existing CRM stays untouched —
it is not the same "Client" concept as the manpower domain.

This spec adds the **Workers** feature (a worker/employee registry), plus
two small supporting entities it links to: **Suppliers** and **Project
clients**. Scope was set by the team-lead meeting the request came from,
using a reference UI (Payload CMS admin screenshots) and a sample worker
JSON record as the source of truth for fields.

Out of scope this round: AI document parsing (mentioned in the reference
but explicitly deferred), Camps/Beds/Mobilizations/Attendance as real
entities (Accommodation/Timesheets tabs ship as empty-state stubs),
anything touching the existing billing `clients` table.

## Data model (new mock tables)

Follows the existing mock-DB pattern: tables defined in
`lib/mock/schema.json` (columns/fks, modeled after the `clients` entry),
rows seeded in `lib/mock/seed.ts`, typed in `types/index.ts`, queried via
`lib/mock/query.ts` through `createAdminClient()` exactly like
`lib/clients/client-queries.ts` does today. All tables get `id` (uuid,
`gen_random_uuid()` default), `user_id` (uuid, not null — mirrors the
tenant scoping every other table uses), `created_at`, `updated_at`.

### `suppliers`
- `name` (text, not null)
- `supplier_code` (text) — display id, e.g. `KAT/SUP/2026/018`
- `license_number` (text)
- `vat_number` (text)
- `contact_name`, `email`, `phone`, `website` (text)
- `notes` (text)
- `trade_license_document_url` (text)
- `vat_registration_document_url` (text)

### `project_clients`
Same shape as `suppliers` (name, client_code, license_number, vat_number,
contact fields, notes, trade_license_document_url,
vat_registration_document_url). Deliberately separate table from the
existing `clients` table — different concept (construction company a
worker is deployed to, not a billing customer).

### `workers`
- `employee_id` (text, unique per user) — e.g. `KAT/EMP/2026/0019`
- `name` (text, not null)
- `nationality` (text)
- `trade_category` (text)
- `status` (text, not null, default `'available'`) — enum-like:
  `available | deployed | on_leave | inactive`
- `supplier_id` (uuid, fk → `suppliers.id`, nullable)
- `notes` (text)
- Document/ID fields, each a plain value + matching `*_document_url`:
  - `passport_number`, `passport_expiry`, `passport_document_url`,
    `passport_document_optional_url`
  - `emirates_id`, `emirates_id_expiry`, `emirates_id_document_url`,
    `emirates_id_document_optional_url`
  - `visa_number`, `visa_expiry`, `visa_document_url`,
    `visa_document_optional_url`
  - `medical_fit` (bool), `medical_expiry` (date)
  - `has_insurance` (bool), `insurance_expiry` (date)
  - `photo_url`
  - `workmen_compensation_document_url`,
    `workmen_compensation_document_optional_url`
  - `medical_insurance_card_url`, `medical_insurance_card_optional_url`
  - `noc_current_sponsor_document_url`, `noc_client_document_url`
  - `trade_license_document_url`
- `cicpa_documents` and `additional_documents`: stored as a separate join
  table `worker_documents` (`worker_id`, `label`, `file_url`,
  `created_at`) rather than JSON blobs, so they list/delete like the rest
  of the mock query builder expects (array columns aren't used elsewhere
  in this schema).

### `worker_clients`
Join table for the worker's `clients[]` array from the reference JSON:
`worker_id` (fk → workers), `project_client_id` (fk → project_clients).

## File uploads

Documents reuse the existing upload mechanics from
`components/features/expenses/expense-form-sheet.tsx` /
`lib/expenses/receipt-utils.ts` (mock storage upload, same pattern as
expense receipts) — one small shared `DocumentUploadField` component
extracted for reuse across Worker/Supplier/Project-client document slots,
instead of copy-pasting the expense-specific version.

## Routes & pages

Mirrors the existing `clients` route structure
(`app/(app)/clients/**`):

- `app/(app)/workers/page.tsx` — list (table: employee id, name,
  nationality, trade category, supplier, status), search/filter by
  status, "Add worker" button
- `app/(app)/workers/new/page.tsx` — create form (Details tab fields)
- `app/(app)/workers/[id]/page.tsx` — detail, tab via `?tab=`, same
  pattern as `parseClientTab`
- `app/(app)/workers/[id]/edit/page.tsx` — edit form
- `app/(app)/suppliers/**` and `app/(app)/project-clients/**` — same
  four-route shape, Details-only (no document-heavy tabs, no
  Accommodation/Timesheets)

Loading states (`loading.tsx`) and layout files mirror `clients/`.

### Worker detail tabs
- **Details** — employee id (readonly after create, matches the
  `KAT/EMP/{year}/{seq}` generator pattern shown in the reference), name,
  nationality, trade category, supplier (select, searchable), linked
  project clients (multi-select), notes, status (side panel, like the
  reference screenshot's right-hand Status field)
- **Documents** — grouped cards matching the reference screenshot exactly:
  Passport, Emirates ID (EID), Visa, Medical & Insurance, Photo, Workmen
  Compensation, Medical Insurance Card, NOC — Current Sponsor / NOC —
  Client, Trade License, CICPA Documents, Additional Documents (repeatable
  label+file rows)
- **Accommodation** — empty-state card ("No accommodation assigned yet")
  — no real data source this round
- **Timesheets** — empty-state card ("No timesheets recorded yet") —
  same treatment

## Navigation

Add to `config/nav.ts`: new `PANE_CONFIGS` section (or new items under
`work`) for Workers, Suppliers, Project clients. Add matching entries to
`ROUTE_TO_SECTION` and `ROUTE_LABELS`.

## Testing

Follow existing patterns: `lib/workers/*.test.ts` for query/mutation
logic (mirrors `lib/clients/*.test.ts`), component stories where the
clients feature has them (e.g. `add-client-button.tsx` has a
`.stories.tsx` sibling — do the same for the worker equivalents).

## Explicit non-goals

- No AI-driven document parsing/autofill.
- No real Camps/Beds/Mobilizations/Attendance backing data — the two
  stub tabs are UI-only placeholders.
- No changes to the existing `clients`, `projects`, `invoices` CRM
  feature.
