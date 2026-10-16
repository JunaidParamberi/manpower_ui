# Workers Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Workers (worker/employee registry) feature to manpower_ui, plus the two supporting entities it links to — Suppliers and Project clients — following the exact patterns already used by the `services` and `clients` features (mock Supabase-shaped DB, zod validation, server actions, shadcn/ui form primitives).

**Architecture:** New mock tables (`suppliers`, `project_clients`, `workers`, `worker_clients`, `worker_documents`) added to `lib/mock/schema.json`; one query file + one mutation file + one validation file per entity, mirroring `lib/services/service-queries.ts` / `lib/services/actions.ts` / `lib/validations/service.ts`. Suppliers and Project clients get a single list+sheet-form page each (mirrors `app/(app)/services/page.tsx` + a form sheet). Workers gets the full four-route shape (`list`, `new`, `[id]`, `[id]/edit`) with a tabbed detail page (Details / Documents / Accommodation / Timesheets), mirroring `app/(app)/clients/**`. Document uploads reuse the expense-receipt upload pattern (`lib/expenses/expense-mutations.ts` `uploadExpenseReceipt` + mock storage).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui (Base preset), react-hook-form, zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-16-workers-feature-design.md`

## Global Constraints

- Every new table gets `id` (uuid, `gen_random_uuid()`), `user_id` (uuid, not null, no FK target in this mock — mirrors `services`/`clients`: FK listed as `auth.users_user_id_fkey` → `auth.users.id`), `created_at`, `updated_at` (timestamptz, `now()`).
- All server actions scope every read/write by `user_id` from `getServerContext()` — never trust a client-supplied `user_id`.
- All list/mutation server code goes through `createAdminClient()` (queries) or `createClient()`/`getServerContext()` (mutations) exactly like `lib/services/*` and `lib/clients/*` — never import `lib/mock/*` directly from app code.
- Zod schemas are the single source of truth for field limits; UI components never hardcode a `maxLength` that isn't backed by the schema.
- No AI document parsing, no Camps/Beds/Mobilizations/Attendance tables — Accommodation and Timesheets tabs are static empty-state cards this round.
- Existing `clients`, `projects`, `invoices`, `expenses` tables/routes are not modified.

## Review Focus

- Deleting a Supplier that still has Workers linked to it — `worker.supplier_id` has `ON DELETE SET NULL` in the FK entry so deletion doesn't orphan-crash the worker list; a test deletes a supplier with a linked worker and asserts the worker's `supplier_id` becomes `null` rather than the delete failing or the worker vanishing.
- Submitting the Worker form with no document files attached — every document field is optional; create/update must succeed with zero uploads, not just with files present.
- A duplicate `employee_id` within the same user's workspace — the unique constraint must produce a clean validation error (mirrors how `clients`/`services` surface `23505`), not a raw DB exception reaching the UI.
- Uploading an unsupported file type (e.g. `.exe`) to a worker document slot — must be rejected client- and server-side with the same message style as `validateReceiptFile` in `lib/expenses/expense-mutations.ts`, not silently accepted.
- Visiting `/workers/[id]` for an id that doesn't exist or belongs to another user — must 404 via `notFound()`, matching `ClientDetail`'s behavior, not throw or render an empty shell.

---

## Task 1: Mock schema — suppliers, project_clients, workers, worker_clients, worker_documents

**Files:**
- Modify: `lib/mock/schema.json`
- Modify: `types/index.ts`
- Test: `lib/mock/schema-workers.test.ts`

**Interfaces:**
- Produces: table names `suppliers`, `project_clients`, `workers`, `worker_clients`, `worker_documents` queryable via `createAdminClient().from(<table>)`; TypeScript types `SupplierRow`, `ProjectClientRow`, `WorkerRow`, `WorkerStatus`, `WorkerClientRow`, `WorkerDocumentRow` exported from `types/index.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/mock/schema-workers.test.ts
import { describe, expect, it } from "vitest";
import { getTable, hasTable } from "@/lib/mock/schema";

describe("workers-domain schema", () => {
  it.each(["suppliers", "project_clients", "workers", "worker_clients", "worker_documents"])(
    "%s table exists with id/user_id/created_at/updated_at",
    (name) => {
      expect(hasTable(name)).toBe(true);
      const table = getTable(name)!;
      const columnNames = table.columns.map((c) => c.name);
      expect(columnNames).toContain("id");
      expect(columnNames).toContain("created_at");
      expect(columnNames).toContain("updated_at");
    },
  );

  it("workers.employee_id is unique and supplier_id FKs to suppliers with SET NULL", () => {
    const table = getTable("workers")!;
    expect(table.uniqueConstraints).toContainEqual(["user_id", "employee_id"]);
    const fk = table.foreignKeys.find((f) => f.columns.includes("supplier_id"));
    expect(fk?.refTable).toBe("suppliers");
  });

  it("worker_clients and worker_documents FK back to workers", () => {
    const wc = getTable("worker_clients")!;
    expect(wc.foreignKeys.some((f) => f.refTable === "workers")).toBe(true);
    expect(wc.foreignKeys.some((f) => f.refTable === "project_clients")).toBe(true);

    const wd = getTable("worker_documents")!;
    expect(wd.foreignKeys.some((f) => f.refTable === "workers")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/mock/schema-workers.test.ts`
Expected: FAIL — tables don't exist yet (`hasTable` returns `false`).

- [ ] **Step 3: Add the table definitions to `lib/mock/schema.json`**

Open `lib/mock/schema.json`, find the `"services": { ... }` entry (~line 409 area) and add five new top-level entries to the same object, following that entry's exact column shape (`name`, `type`, `kind`, `notNull`, `pk`, `identity`, `default?`). Column `kind` values are one of `"uuid" | "timestamp" | "date" | "bool" | "numeric" | "int" | "json" | "text"` (see `lib/mock/schema.ts`).

Add after the `services` entry:

```json
"suppliers": {
  "columns": [
    { "name": "id", "type": "uuid", "kind": "uuid", "notNull": false, "pk": true, "identity": false, "default": "gen_random_uuid()" },
    { "name": "user_id", "type": "uuid", "kind": "uuid", "notNull": true, "pk": false, "identity": false },
    { "name": "name", "type": "text", "kind": "text", "notNull": true, "pk": false, "identity": false },
    { "name": "supplier_code", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "license_number", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "vat_number", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "contact_name", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "email", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "phone", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "website", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "notes", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "trade_license_document_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "vat_registration_document_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "created_at", "type": "timestamptz", "kind": "timestamp", "notNull": true, "pk": false, "identity": false, "default": "now()" },
    { "name": "updated_at", "type": "timestamptz", "kind": "timestamp", "notNull": true, "pk": false, "identity": false, "default": "now()" }
  ],
  "foreignKeys": [
    { "name": "auth.users_user_id_fkey", "columns": ["user_id"], "refTable": "auth.users", "refColumns": ["id"] }
  ],
  "uniqueConstraints": [["user_id", "supplier_code"]]
},
"project_clients": {
  "columns": [
    { "name": "id", "type": "uuid", "kind": "uuid", "notNull": false, "pk": true, "identity": false, "default": "gen_random_uuid()" },
    { "name": "user_id", "type": "uuid", "kind": "uuid", "notNull": true, "pk": false, "identity": false },
    { "name": "name", "type": "text", "kind": "text", "notNull": true, "pk": false, "identity": false },
    { "name": "client_code", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "license_number", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "vat_number", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "contact_name", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "email", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "phone", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "website", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "notes", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "trade_license_document_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "vat_registration_document_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "created_at", "type": "timestamptz", "kind": "timestamp", "notNull": true, "pk": false, "identity": false, "default": "now()" },
    { "name": "updated_at", "type": "timestamptz", "kind": "timestamp", "notNull": true, "pk": false, "identity": false, "default": "now()" }
  ],
  "foreignKeys": [
    { "name": "auth.users_user_id_fkey", "columns": ["user_id"], "refTable": "auth.users", "refColumns": ["id"] }
  ],
  "uniqueConstraints": [["user_id", "client_code"]]
},
"workers": {
  "columns": [
    { "name": "id", "type": "uuid", "kind": "uuid", "notNull": false, "pk": true, "identity": false, "default": "gen_random_uuid()" },
    { "name": "user_id", "type": "uuid", "kind": "uuid", "notNull": true, "pk": false, "identity": false },
    { "name": "employee_id", "type": "text", "kind": "text", "notNull": true, "pk": false, "identity": false },
    { "name": "name", "type": "text", "kind": "text", "notNull": true, "pk": false, "identity": false },
    { "name": "nationality", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "trade_category", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "status", "type": "text", "kind": "text", "notNull": true, "pk": false, "identity": false, "default": "'available'" },
    { "name": "supplier_id", "type": "uuid", "kind": "uuid", "notNull": false, "pk": false, "identity": false },
    { "name": "notes", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "passport_number", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "passport_expiry", "type": "date", "kind": "date", "notNull": false, "pk": false, "identity": false },
    { "name": "passport_document_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "passport_document_optional_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "emirates_id", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "emirates_id_expiry", "type": "date", "kind": "date", "notNull": false, "pk": false, "identity": false },
    { "name": "emirates_id_document_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "emirates_id_document_optional_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "visa_number", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "visa_expiry", "type": "date", "kind": "date", "notNull": false, "pk": false, "identity": false },
    { "name": "visa_document_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "visa_document_optional_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "medical_fit", "type": "boolean", "kind": "bool", "notNull": true, "pk": false, "identity": false, "default": "false" },
    { "name": "medical_expiry", "type": "date", "kind": "date", "notNull": false, "pk": false, "identity": false },
    { "name": "has_insurance", "type": "boolean", "kind": "bool", "notNull": true, "pk": false, "identity": false, "default": "false" },
    { "name": "insurance_expiry", "type": "date", "kind": "date", "notNull": false, "pk": false, "identity": false },
    { "name": "photo_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "workmen_compensation_document_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "workmen_compensation_document_optional_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "medical_insurance_card_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "medical_insurance_card_optional_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "noc_current_sponsor_document_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "noc_client_document_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "trade_license_document_url", "type": "text", "kind": "text", "notNull": false, "pk": false, "identity": false },
    { "name": "created_at", "type": "timestamptz", "kind": "timestamp", "notNull": true, "pk": false, "identity": false, "default": "now()" },
    { "name": "updated_at", "type": "timestamptz", "kind": "timestamp", "notNull": true, "pk": false, "identity": false, "default": "now()" }
  ],
  "foreignKeys": [
    { "name": "auth.users_user_id_fkey", "columns": ["user_id"], "refTable": "auth.users", "refColumns": ["id"] },
    { "name": "workers_supplier_id_fkey", "columns": ["supplier_id"], "refTable": "suppliers", "refColumns": ["id"] }
  ],
  "uniqueConstraints": [["user_id", "employee_id"]]
},
"worker_clients": {
  "columns": [
    { "name": "id", "type": "uuid", "kind": "uuid", "notNull": false, "pk": true, "identity": false, "default": "gen_random_uuid()" },
    { "name": "user_id", "type": "uuid", "kind": "uuid", "notNull": true, "pk": false, "identity": false },
    { "name": "worker_id", "type": "uuid", "kind": "uuid", "notNull": true, "pk": false, "identity": false },
    { "name": "project_client_id", "type": "uuid", "kind": "uuid", "notNull": true, "pk": false, "identity": false },
    { "name": "created_at", "type": "timestamptz", "kind": "timestamp", "notNull": true, "pk": false, "identity": false, "default": "now()" },
    { "name": "updated_at", "type": "timestamptz", "kind": "timestamp", "notNull": true, "pk": false, "identity": false, "default": "now()" }
  ],
  "foreignKeys": [
    { "name": "auth.users_user_id_fkey", "columns": ["user_id"], "refTable": "auth.users", "refColumns": ["id"] },
    { "name": "worker_clients_worker_id_fkey", "columns": ["worker_id"], "refTable": "workers", "refColumns": ["id"] },
    { "name": "worker_clients_project_client_id_fkey", "columns": ["project_client_id"], "refTable": "project_clients", "refColumns": ["id"] }
  ],
  "uniqueConstraints": [["worker_id", "project_client_id"]]
},
"worker_documents": {
  "columns": [
    { "name": "id", "type": "uuid", "kind": "uuid", "notNull": false, "pk": true, "identity": false, "default": "gen_random_uuid()" },
    { "name": "user_id", "type": "uuid", "kind": "uuid", "notNull": true, "pk": false, "identity": false },
    { "name": "worker_id", "type": "uuid", "kind": "uuid", "notNull": true, "pk": false, "identity": false },
    { "name": "category", "type": "text", "kind": "text", "notNull": true, "pk": false, "identity": false, "default": "'additional'" },
    { "name": "label", "type": "text", "kind": "text", "notNull": true, "pk": false, "identity": false },
    { "name": "file_url", "type": "text", "kind": "text", "notNull": true, "pk": false, "identity": false },
    { "name": "created_at", "type": "timestamptz", "kind": "timestamp", "notNull": true, "pk": false, "identity": false, "default": "now()" },
    { "name": "updated_at", "type": "timestamptz", "kind": "timestamp", "notNull": true, "pk": false, "identity": false, "default": "now()" }
  ],
  "foreignKeys": [
    { "name": "auth.users_user_id_fkey", "columns": ["user_id"], "refTable": "auth.users", "refColumns": ["id"] },
    { "name": "worker_documents_worker_id_fkey", "columns": ["worker_id"], "refTable": "workers", "refColumns": ["id"] }
  ],
  "uniqueConstraints": []
}
```

`category` on `worker_documents` is `"cicpa" | "additional"` (distinguishes the two repeatable lists from the reference screenshot).

- [ ] **Step 4: Add the FK cascade behavior note and run the FK/delete test**

The mock query builder's delete path needs `workers.supplier_id` to null out rather than block when a `suppliers` row is deleted. Check `lib/mock/db.ts` / `lib/mock/query.ts` for how `.delete()` currently handles FKs (grep `refTable` in `lib/mock/query.ts`). If the builder already defaults non-PK-chain FKs to "allow, don't enforce cascade," no code change is needed here — only `services`/`clients`-style FKs that are referenced from PK children (like `projects_client_id_fkey` blocking client delete) need special handling, and `workers.supplier_id` is the reverse direction (worker references supplier, not a child collection), so Task 7's `deleteSupplier` mutation sets `supplier_id = null` on linked workers explicitly before/instead of relying on DB-level cascade — this keeps the behavior explicit and testable at the mutation layer rather than the mock query layer. No `lib/mock/query.ts` change needed in this task.

- [ ] **Step 5: Add the TypeScript row types to `types/index.ts`**

Add after `ClientRow` (or at end of file):

```ts
/** Row shape for `public.suppliers`. */
export type SupplierRow = {
  id: string;
  user_id: string;
  name: string;
  supplier_code: string | null;
  license_number: string | null;
  vat_number: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  trade_license_document_url: string | null;
  vat_registration_document_url: string | null;
  created_at: string;
  updated_at: string;
};

/** Row shape for `public.project_clients`. */
export type ProjectClientRow = {
  id: string;
  user_id: string;
  name: string;
  client_code: string | null;
  license_number: string | null;
  vat_number: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  trade_license_document_url: string | null;
  vat_registration_document_url: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkerStatus = "available" | "deployed" | "on_leave" | "inactive";

/** Row shape for `public.workers`. */
export type WorkerRow = {
  id: string;
  user_id: string;
  employee_id: string;
  name: string;
  nationality: string | null;
  trade_category: string | null;
  status: WorkerStatus;
  supplier_id: string | null;
  notes: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  passport_document_url: string | null;
  passport_document_optional_url: string | null;
  emirates_id: string | null;
  emirates_id_expiry: string | null;
  emirates_id_document_url: string | null;
  emirates_id_document_optional_url: string | null;
  visa_number: string | null;
  visa_expiry: string | null;
  visa_document_url: string | null;
  visa_document_optional_url: string | null;
  medical_fit: boolean;
  medical_expiry: string | null;
  has_insurance: boolean;
  insurance_expiry: string | null;
  photo_url: string | null;
  workmen_compensation_document_url: string | null;
  workmen_compensation_document_optional_url: string | null;
  medical_insurance_card_url: string | null;
  medical_insurance_card_optional_url: string | null;
  noc_current_sponsor_document_url: string | null;
  noc_client_document_url: string | null;
  trade_license_document_url: string | null;
  created_at: string;
  updated_at: string;
};

/** Row shape for `public.worker_clients`. */
export type WorkerClientRow = {
  id: string;
  user_id: string;
  worker_id: string;
  project_client_id: string;
  created_at: string;
  updated_at: string;
};

export type WorkerDocumentCategory = "cicpa" | "additional";

/** Row shape for `public.worker_documents`. */
export type WorkerDocumentRow = {
  id: string;
  user_id: string;
  worker_id: string;
  category: WorkerDocumentCategory;
  label: string;
  file_url: string;
  created_at: string;
  updated_at: string;
};

/** Worker row with its linked supplier name and project-client names for list/detail UI. */
export type WorkerListRow = WorkerRow & {
  supplier: { id: string; name: string } | null;
  clients: { id: string; name: string }[];
};
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run lib/mock/schema-workers.test.ts`
Expected: PASS

- [ ] **Step 7: Run full test suite and typecheck to confirm no regressions**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS (new types compile; existing tests untouched)

- [ ] **Step 8: Commit**

```bash
git add lib/mock/schema.json types/index.ts lib/mock/schema-workers.test.ts
git commit -m "feat: add workers/suppliers/project_clients mock schema and types"
```

---

## Task 2: Seed data for suppliers, project_clients, workers

**Files:**
- Modify: `lib/mock/seed.ts`

**Interfaces:**
- Consumes: `insertRow`, `push` helper defined in `lib/mock/seed.ts` (`push(table, payload)`).
- Produces: 3 seeded suppliers, 3 seeded project_clients, 6 seeded workers (2 per supplier) with a mix of statuses and at least one worker linked to 2 project_clients via `worker_clients`, so list/detail pages have non-empty demo data.

- [ ] **Step 1: Add the seed block**

In `lib/mock/seed.ts`, inside `seedWorkspace`, after the existing `clients` seed block (the one ending with `const clients = clientSeeds.map(...)`), add:

```ts
  // ── Suppliers ────────────────────────────────────────────────────────
  type SupplierSeed = {
    name: string;
    code: string;
    license: string;
    vat: string | null;
    contact: string | null;
    email: string | null;
  };

  const supplierSeeds: SupplierSeed[] = [
    { name: "Jubily Power Technical Services L.L.C", code: "SUP/2026/001", license: "658443", vat: null, contact: "Ahmed Khalil", email: "ops@jubily.ae" },
    { name: "Al Maha Manpower Services", code: "SUP/2026/002", license: "214410", vat: "TRN100221000300003", contact: "Fatima Noor", email: "contact@almaha-ms.ae" },
    { name: "Gulf Trade Workforce Co", code: "SUP/2026/003", license: "778821", vat: null, contact: null, email: null },
  ];

  const suppliers = supplierSeeds.map(
    (s) =>
      push("suppliers", {
        user_id: userId,
        name: s.name,
        supplier_code: s.code,
        license_number: s.license,
        vat_number: s.vat,
        contact_name: s.contact,
        email: s.email,
        phone: null,
        website: null,
        notes: null,
        trade_license_document_url: null,
        vat_registration_document_url: null,
      })!,
  );

  // ── Project clients ──────────────────────────────────────────────────
  type ProjectClientSeed = { name: string; code: string; license: string };

  const projectClientSeeds: ProjectClientSeed[] = [
    { name: "G C S German Concrete Works and Building Contracting L.L.C", code: "PCL/2026/001", license: "812947" },
    { name: "Falcon Heights Construction L.L.C", code: "PCL/2026/002", license: "905512" },
  ];

  const projectClients = projectClientSeeds.map(
    (c) =>
      push("project_clients", {
        user_id: userId,
        name: c.name,
        client_code: c.code,
        license_number: c.license,
        vat_number: null,
        contact_name: null,
        email: null,
        phone: null,
        website: null,
        notes: null,
        trade_license_document_url: null,
        vat_registration_document_url: null,
      })!,
  );

  // ── Workers ───────────────────────────────────────────────────────────
  type WorkerSeed = {
    employeeId: string;
    name: string;
    nationality: string;
    trade: string;
    status: "available" | "deployed" | "on_leave" | "inactive";
    supplierIdx: number;
  };

  const workerSeeds: WorkerSeed[] = [
    { employeeId: "EMP/2026/0001", name: "Salifu Mumuni", nationality: "Ghana", trade: "Helper", status: "available", supplierIdx: 0 },
    { employeeId: "EMP/2026/0002", name: "Ibrahim Yusuf", nationality: "Ghana", trade: "Mason", status: "deployed", supplierIdx: 0 },
    { employeeId: "EMP/2026/0003", name: "Ramesh Kumar", nationality: "India", trade: "Electrician", status: "available", supplierIdx: 1 },
    { employeeId: "EMP/2026/0004", name: "Suresh Patel", nationality: "India", trade: "Plumber", status: "on_leave", supplierIdx: 1 },
    { employeeId: "EMP/2026/0005", name: "Juan Dela Cruz", nationality: "Philippines", trade: "Welder", status: "deployed", supplierIdx: 2 },
    { employeeId: "EMP/2026/0006", name: "Mark Santos", nationality: "Philippines", trade: "Carpenter", status: "inactive", supplierIdx: 2 },
  ];

  const workers = workerSeeds.map((w) =>
    push("workers", {
      user_id: userId,
      employee_id: w.employeeId,
      name: w.name,
      nationality: w.nationality,
      trade_category: w.trade,
      status: w.status,
      supplier_id: suppliers[w.supplierIdx].id,
      notes: null,
      passport_number: null,
      passport_expiry: null,
      passport_document_url: null,
      passport_document_optional_url: null,
      emirates_id: null,
      emirates_id_expiry: null,
      emirates_id_document_url: null,
      emirates_id_document_optional_url: null,
      visa_number: null,
      visa_expiry: null,
      visa_document_url: null,
      visa_document_optional_url: null,
      medical_fit: false,
      medical_expiry: null,
      has_insurance: false,
      insurance_expiry: null,
      photo_url: null,
      workmen_compensation_document_url: null,
      workmen_compensation_document_optional_url: null,
      medical_insurance_card_url: null,
      medical_insurance_card_optional_url: null,
      noc_current_sponsor_document_url: null,
      noc_client_document_url: null,
      trade_license_document_url: null,
    })!,
  );

  push("worker_clients", {
    user_id: userId,
    worker_id: workers[0].id,
    project_client_id: projectClients[0].id,
  });
  push("worker_clients", {
    user_id: userId,
    worker_id: workers[1].id,
    project_client_id: projectClients[0].id,
  });
  push("worker_clients", {
    user_id: userId,
    worker_id: workers[2].id,
    project_client_id: projectClients[1].id,
  });
```

- [ ] **Step 2: Reset the local demo DB and confirm seeding works**

Run: `rm -f mock-db.json && npm run dev &` then hit `http://localhost:3000` and log in (any email/password), then `curl -s http://localhost:3000/api/account 2>/dev/null | head -c 200; kill %1` — or simpler, just run the typecheck/build which doesn't touch the DB, and manually verify in Task 9 once the Workers UI exists. Minimal automated check here:

Run: `npx tsc --noEmit`
Expected: PASS — seed block compiles against the new `push`/table shapes.

- [ ] **Step 3: Commit**

```bash
git add lib/mock/seed.ts
git commit -m "feat: seed demo suppliers, project clients, and workers"
```

---

## Task 3: Validation schemas (supplier, project-client, worker)

**Files:**
- Create: `lib/validations/supplier.ts`
- Create: `lib/validations/project-client.ts`
- Create: `lib/validations/worker.ts`
- Test: `lib/validations/supplier.test.ts`
- Test: `lib/validations/worker.test.ts`

**Interfaces:**
- Produces: `supplierInputSchema`, `SupplierInput` from `lib/validations/supplier.ts`; `projectClientInputSchema`, `ProjectClientInput` from `lib/validations/project-client.ts`; `WORKER_STATUSES`, `WORKER_STATUS_LABELS`, `workerInputSchema`, `WorkerInput` from `lib/validations/worker.ts`.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/validations/supplier.test.ts
import { describe, expect, it } from "vitest";
import { supplierInputSchema } from "./supplier";

describe("supplierInputSchema", () => {
  it("requires a name", () => {
    const result = supplierInputSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("accepts a minimal valid payload", () => {
    const result = supplierInputSchema.safeParse({ name: "Acme Manpower" });
    expect(result.success).toBe(true);
  });
});
```

```ts
// lib/validations/worker.test.ts
import { describe, expect, it } from "vitest";
import { workerInputSchema } from "./worker";

describe("workerInputSchema", () => {
  it("requires employee_id and name", () => {
    const result = workerInputSchema.safeParse({ employee_id: "", name: "" });
    expect(result.success).toBe(false);
  });

  it("defaults status to available", () => {
    const result = workerInputSchema.safeParse({
      employee_id: "EMP/2026/0099",
      name: "Test Worker",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("available");
    }
  });

  it("rejects an invalid status", () => {
    const result = workerInputSchema.safeParse({
      employee_id: "EMP/2026/0099",
      name: "Test Worker",
      status: "on_vacation",
    });
    expect(result.success).toBe(false);
  });

  it("coerces medical_fit/has_insurance checkbox strings to booleans", () => {
    const result = workerInputSchema.safeParse({
      employee_id: "EMP/2026/0099",
      name: "Test Worker",
      medical_fit: "true",
      has_insurance: "false",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.medical_fit).toBe(true);
      expect(result.data.has_insurance).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/validations/supplier.test.ts lib/validations/worker.test.ts`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Write `lib/validations/supplier.ts`**

```ts
import { z } from "zod";

export const SUPPLIER_LIMITS = {
  name: 300,
  supplier_code: 100,
  license_number: 100,
  vat_number: 100,
  contact_name: 200,
  email: 320,
  phone: 50,
  website: 500,
  notes: 4000,
} as const;

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().default("");

export const supplierInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required.").max(SUPPLIER_LIMITS.name),
  supplier_code: optionalString(SUPPLIER_LIMITS.supplier_code),
  license_number: optionalString(SUPPLIER_LIMITS.license_number),
  vat_number: optionalString(SUPPLIER_LIMITS.vat_number),
  contact_name: optionalString(SUPPLIER_LIMITS.contact_name),
  email: optionalString(SUPPLIER_LIMITS.email),
  phone: optionalString(SUPPLIER_LIMITS.phone),
  website: optionalString(SUPPLIER_LIMITS.website),
  notes: optionalString(SUPPLIER_LIMITS.notes),
});

export type SupplierInput = z.infer<typeof supplierInputSchema>;
```

- [ ] **Step 4: Write `lib/validations/project-client.ts`**

```ts
import { z } from "zod";

export const PROJECT_CLIENT_LIMITS = {
  name: 300,
  client_code: 100,
  license_number: 100,
  vat_number: 100,
  contact_name: 200,
  email: 320,
  phone: 50,
  website: 500,
  notes: 4000,
} as const;

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().default("");

export const projectClientInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required.").max(PROJECT_CLIENT_LIMITS.name),
  client_code: optionalString(PROJECT_CLIENT_LIMITS.client_code),
  license_number: optionalString(PROJECT_CLIENT_LIMITS.license_number),
  vat_number: optionalString(PROJECT_CLIENT_LIMITS.vat_number),
  contact_name: optionalString(PROJECT_CLIENT_LIMITS.contact_name),
  email: optionalString(PROJECT_CLIENT_LIMITS.email),
  phone: optionalString(PROJECT_CLIENT_LIMITS.phone),
  website: optionalString(PROJECT_CLIENT_LIMITS.website),
  notes: optionalString(PROJECT_CLIENT_LIMITS.notes),
});

export type ProjectClientInput = z.infer<typeof projectClientInputSchema>;
```

- [ ] **Step 5: Write `lib/validations/worker.ts`**

```ts
import { z } from "zod";

export const WORKER_LIMITS = {
  employee_id: 100,
  name: 300,
  nationality: 100,
  trade_category: 100,
  notes: 4000,
  doc_number: 100,
} as const;

export const WORKER_STATUSES = ["available", "deployed", "on_leave", "inactive"] as const;
export type WorkerStatusValue = (typeof WORKER_STATUSES)[number];

export const WORKER_STATUS_LABELS: Record<WorkerStatusValue, string> = {
  available: "Available",
  deployed: "Deployed",
  on_leave: "On leave",
  inactive: "Inactive",
};

export const workerStatusSchema = z.enum(WORKER_STATUSES);

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().default("");

const optionalDate = () =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().nullish(),
  );

const checkboxBoolean = () =>
  z.preprocess((v) => {
    if (typeof v === "boolean") return v;
    if (v === "true" || v === "on") return true;
    if (v === "false" || v === undefined || v === null || v === "") return false;
    return v;
  }, z.boolean().default(false));

export const workerInputSchema = z.object({
  id: z.string().uuid().optional(),
  employee_id: z.string().trim().min(1, "Employee ID is required.").max(WORKER_LIMITS.employee_id),
  name: z.string().trim().min(1, "Name is required.").max(WORKER_LIMITS.name),
  nationality: optionalString(WORKER_LIMITS.nationality),
  trade_category: optionalString(WORKER_LIMITS.trade_category),
  status: workerStatusSchema.default("available"),
  supplier_id: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().uuid().nullish(),
  ).optional(),
  client_ids: z.array(z.string().uuid()).optional().default([]),
  notes: optionalString(WORKER_LIMITS.notes),
  passport_number: optionalString(WORKER_LIMITS.doc_number),
  passport_expiry: optionalDate(),
  emirates_id: optionalString(WORKER_LIMITS.doc_number),
  emirates_id_expiry: optionalDate(),
  visa_number: optionalString(WORKER_LIMITS.doc_number),
  visa_expiry: optionalDate(),
  medical_fit: checkboxBoolean(),
  medical_expiry: optionalDate(),
  has_insurance: checkboxBoolean(),
  insurance_expiry: optionalDate(),
});

export type WorkerInput = z.infer<typeof workerInputSchema>;
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run lib/validations/supplier.test.ts lib/validations/worker.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/validations/supplier.ts lib/validations/project-client.ts lib/validations/worker.ts lib/validations/supplier.test.ts lib/validations/worker.test.ts
git commit -m "feat: add supplier/project-client/worker validation schemas"
```

---

## Task 4: Suppliers queries + mutations

**Files:**
- Create: `lib/suppliers/supplier-queries.ts`
- Create: `lib/suppliers/supplier-mutations.ts`
- Test: `lib/suppliers/supplier-mutations.test.ts`

**Interfaces:**
- Consumes: `supplierInputSchema` from Task 3 (`lib/validations/supplier.ts`); `getServerContext` from `@/lib/supabase/get-server-context`; `createAdminClient` from `@/lib/supabase/admin`.
- Produces: `listSuppliers(): Promise<SupplierRow[]>` (queries); `createSupplier(raw: unknown): Promise<SupplierResult>`, `updateSupplier(raw: unknown): Promise<SupplierResult>`, `deleteSupplier(id: string): Promise<OkResult>` (mutations), where `SupplierResult = { ok: true; supplier: SupplierRow } | { ok: false; error: string }` and `OkResult = { ok: true } | { ok: false; error: string }`. `deleteSupplier` is consumed by Task 9's UI and by Task 8's worker-detail "unlink on supplier delete" behavior.

- [ ] **Step 1: Write `lib/suppliers/supplier-queries.ts`**

```ts
import { unstable_cache } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupplierRow } from "@/types";

const _cachedListSuppliers = unstable_cache(
  async (userId: string): Promise<SupplierRow[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });
    if (error || !data) return [];
    return data as SupplierRow[];
  },
  ["list-suppliers"],
  { revalidate: 60, tags: ["suppliers"] },
);

export async function listSuppliers(): Promise<SupplierRow[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedListSuppliers(user.id);
}

export async function getSupplierById(id: string): Promise<SupplierRow | null> {
  const { user } = await getServerContext();
  if (!user) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as SupplierRow;
}
```

- [ ] **Step 2: Write the failing mutation test**

```ts
// lib/suppliers/supplier-mutations.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createSupplier, deleteSupplier } from "./supplier-mutations";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: unknown) => fn),
}));

vi.mock("@/lib/supabase/get-server-context", () => ({
  getServerContext: vi.fn(),
}));

function chain(result: { data: unknown; error: unknown }) {
  const q: Record<string, unknown> = {};
  q.insert = vi.fn(() => q);
  q.update = vi.fn(() => q);
  q.select = vi.fn(() => q);
  q.eq = vi.fn(() => q);
  q.single = vi.fn(async () => result);
  return q;
}

describe("createSupplier", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects when unauthenticated", async () => {
    vi.mocked(getServerContext).mockResolvedValue({ supabase: null, user: null } as never);
    const result = await createSupplier({ name: "Acme" });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty name", async () => {
    const supabase = { from: vi.fn(() => chain({ data: null, error: null })) };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createSupplier({ name: "" });
    expect(result.ok).toBe(false);
  });

  it("creates a supplier and revalidates", async () => {
    const row = { id: "s1", user_id: "u1", name: "Acme", supplier_code: "" };
    const supabase = { from: vi.fn(() => chain({ data: row, error: null })) };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createSupplier({ name: "Acme" });
    expect(result.ok).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith("suppliers");
    expect(revalidatePath).toHaveBeenCalledWith("/suppliers");
  });
});

describe("deleteSupplier", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an invalid id", async () => {
    const result = await deleteSupplier("not-a-uuid");
    expect(result.ok).toBe(false);
  });

  it("nulls out supplier_id on linked workers before deleting", async () => {
    const workersUpdateEq = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
    const workersQuery = { update: vi.fn(() => ({ eq: workersUpdateEq })) };
    const suppliersQuery = { delete: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })) })) };
    const supabase = {
      from: vi.fn((table: string) => (table === "workers" ? workersQuery : suppliersQuery)),
    };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const id = "11111111-1111-4111-8111-111111111111";
    const result = await deleteSupplier(id);
    expect(result.ok).toBe(true);
    expect(workersQuery.update).toHaveBeenCalledWith({ supplier_id: null });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/suppliers/supplier-mutations.test.ts`
Expected: FAIL — `./supplier-mutations` doesn't exist.

- [ ] **Step 4: Write `lib/suppliers/supplier-mutations.ts`**

```ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { supplierInputSchema } from "@/lib/validations/supplier";
import type { SupplierRow } from "@/types";

type SupplierResult =
  | { ok: true; supplier: SupplierRow }
  | { ok: false; error: string };

type OkResult = { ok: true } | { ok: false; error: string };

const uuidSchema = z.string().uuid();

function revalidate() {
  revalidateTag("suppliers");
  revalidatePath("/suppliers");
}

export async function createSupplier(raw: unknown): Promise<SupplierResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = supplierInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      supplier_code: parsed.data.supplier_code || null,
      license_number: parsed.data.license_number || null,
      vat_number: parsed.data.vat_number || null,
      contact_name: parsed.data.contact_name || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      website: parsed.data.website || null,
      notes: parsed.data.notes || null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true, supplier: data as SupplierRow };
}

export async function updateSupplier(raw: unknown): Promise<SupplierResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = supplierInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  if (!parsed.data.id) return { ok: false, error: "Supplier id required for update" };

  const { data, error } = await supabase
    .from("suppliers")
    .update({
      name: parsed.data.name,
      supplier_code: parsed.data.supplier_code || null,
      license_number: parsed.data.license_number || null,
      vat_number: parsed.data.vat_number || null,
      contact_name: parsed.data.contact_name || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      website: parsed.data.website || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true, supplier: data as SupplierRow };
}

export async function deleteSupplier(id: string): Promise<OkResult> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const unlink = await supabase
    .from("workers")
    .update({ supplier_id: null })
    .eq("supplier_id", parsed.data)
    .eq("user_id", user.id);
  if (unlink.error) return { ok: false, error: unlink.error.message };

  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidate();
  revalidateTag("workers");
  revalidatePath("/workers");
  return { ok: true };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/suppliers/supplier-mutations.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/suppliers/
git commit -m "feat: add supplier queries and mutations"
```

---

## Task 5: Project clients queries + mutations

**Files:**
- Create: `lib/project-clients/project-client-queries.ts`
- Create: `lib/project-clients/project-client-mutations.ts`
- Test: `lib/project-clients/project-client-mutations.test.ts`

**Interfaces:**
- Consumes: `projectClientInputSchema` from Task 3.
- Produces: `listProjectClients(): Promise<ProjectClientRow[]>`, `getProjectClientById(id): Promise<ProjectClientRow | null>`, `createProjectClient`, `updateProjectClient`, `deleteProjectClient` — same result-type shapes as Task 4's Supplier equivalents. Consumed by Task 10's Project Clients UI and by Task 7's worker multi-select.

- [ ] **Step 1: Write `lib/project-clients/project-client-queries.ts`**

Identical structure to Task 4 Step 1, table `"project_clients"`, type `ProjectClientRow`:

```ts
import { unstable_cache } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProjectClientRow } from "@/types";

const _cachedListProjectClients = unstable_cache(
  async (userId: string): Promise<ProjectClientRow[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("project_clients")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });
    if (error || !data) return [];
    return data as ProjectClientRow[];
  },
  ["list-project-clients"],
  { revalidate: 60, tags: ["project_clients"] },
);

export async function listProjectClients(): Promise<ProjectClientRow[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedListProjectClients(user.id);
}

export async function getProjectClientById(id: string): Promise<ProjectClientRow | null> {
  const { user } = await getServerContext();
  if (!user) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("project_clients")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProjectClientRow;
}
```

- [ ] **Step 2: Write the failing mutation test**

```ts
// lib/project-clients/project-client-mutations.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createProjectClient, deleteProjectClient } from "./project-client-mutations";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: unknown) => fn),
}));

vi.mock("@/lib/supabase/get-server-context", () => ({
  getServerContext: vi.fn(),
}));

function chain(result: { data: unknown; error: unknown }) {
  const q: Record<string, unknown> = {};
  q.insert = vi.fn(() => q);
  q.select = vi.fn(() => q);
  q.eq = vi.fn(() => q);
  q.single = vi.fn(async () => result);
  return q;
}

describe("createProjectClient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an empty name", async () => {
    const supabase = { from: vi.fn(() => chain({ data: null, error: null })) };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createProjectClient({ name: "" });
    expect(result.ok).toBe(false);
  });

  it("creates and revalidates", async () => {
    const row = { id: "c1", user_id: "u1", name: "GCS" };
    const supabase = { from: vi.fn(() => chain({ data: row, error: null })) };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createProjectClient({ name: "GCS" });
    expect(result.ok).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith("project_clients");
  });
});

describe("deleteProjectClient", () => {
  it("rejects an invalid id", async () => {
    const result = await deleteProjectClient("not-a-uuid");
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/project-clients/project-client-mutations.test.ts`
Expected: FAIL

- [ ] **Step 4: Write `lib/project-clients/project-client-mutations.ts`**

```ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { projectClientInputSchema } from "@/lib/validations/project-client";
import type { ProjectClientRow } from "@/types";

type ProjectClientResult =
  | { ok: true; projectClient: ProjectClientRow }
  | { ok: false; error: string };

type OkResult = { ok: true } | { ok: false; error: string };

const uuidSchema = z.string().uuid();

function revalidate() {
  revalidateTag("project_clients");
  revalidatePath("/project-clients");
}

export async function createProjectClient(raw: unknown): Promise<ProjectClientResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = projectClientInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { data, error } = await supabase
    .from("project_clients")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      client_code: parsed.data.client_code || null,
      license_number: parsed.data.license_number || null,
      vat_number: parsed.data.vat_number || null,
      contact_name: parsed.data.contact_name || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      website: parsed.data.website || null,
      notes: parsed.data.notes || null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true, projectClient: data as ProjectClientRow };
}

export async function updateProjectClient(raw: unknown): Promise<ProjectClientResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = projectClientInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  if (!parsed.data.id) return { ok: false, error: "Project client id required for update" };

  const { data, error } = await supabase
    .from("project_clients")
    .update({
      name: parsed.data.name,
      client_code: parsed.data.client_code || null,
      license_number: parsed.data.license_number || null,
      vat_number: parsed.data.vat_number || null,
      contact_name: parsed.data.contact_name || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      website: parsed.data.website || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true, projectClient: data as ProjectClientRow };
}

export async function deleteProjectClient(id: string): Promise<OkResult> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  await supabase
    .from("worker_clients")
    .delete()
    .eq("project_client_id", parsed.data)
    .eq("user_id", user.id);

  const { error } = await supabase
    .from("project_clients")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/project-clients/project-client-mutations.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/project-clients/
git commit -m "feat: add project client queries and mutations"
```

---

## Task 6: Worker queries (list + detail, with supplier/clients joined)

**Files:**
- Create: `lib/workers/worker-queries.ts`
- Create: `lib/workers/worker-tab.ts`
- Test: `lib/workers/worker-queries.test.ts`
- Test: `lib/workers/worker-tab.test.ts`

**Interfaces:**
- Consumes: `WorkerRow`, `WorkerListRow`, `SupplierRow`, `ProjectClientRow` from `types/index.ts`.
- Produces: `listWorkers(): Promise<WorkerListRow[]>`, `getWorkerById(id: string): Promise<WorkerListRow | null>` — consumed by Task 9/Task 11's pages. `WORKER_TABS`, `WorkerTab`, `parseWorkerTab(value)` — consumed by Task 11's detail page route.

- [ ] **Step 1: Write `lib/workers/worker-tab.ts`**

```ts
export const WORKER_TABS = ["details", "documents", "accommodation", "timesheets"] as const;
export type WorkerTab = (typeof WORKER_TABS)[number];

export function parseWorkerTab(value: string | string[] | null | undefined): WorkerTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return (WORKER_TABS as readonly string[]).includes(raw ?? "") ? (raw as WorkerTab) : "details";
}
```

- [ ] **Step 2: Write the tab test**

```ts
// lib/workers/worker-tab.test.ts
import { describe, expect, it } from "vitest";
import { parseWorkerTab } from "./worker-tab";

describe("parseWorkerTab", () => {
  it.each<[string | string[] | null | undefined, string]>([
    ["details", "details"],
    ["documents", "documents"],
    ["accommodation", "accommodation"],
    ["timesheets", "timesheets"],
    [["documents", "details"], "documents"],
    ["bogus", "details"],
    [undefined, "details"],
    [null, "details"],
  ])("%s → %s", (input, expected) => {
    expect(parseWorkerTab(input)).toBe(expected);
  });
});
```

- [ ] **Step 3: Run tab test — verify pass immediately (pure function, no dependency wiring needed)**

Run: `npx vitest run lib/workers/worker-tab.test.ts`
Expected: PASS

- [ ] **Step 4: Write `lib/workers/worker-queries.ts`**

```ts
import { unstable_cache } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupplierRow, WorkerListRow, WorkerRow } from "@/types";

async function attachRelations(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  rows: WorkerRow[],
): Promise<WorkerListRow[]> {
  if (rows.length === 0) return [];

  const supplierIds = [...new Set(rows.map((r) => r.supplier_id).filter((v): v is string => Boolean(v)))];
  const suppliersById = new Map<string, SupplierRow>();
  if (supplierIds.length > 0) {
    const { data } = await supabase.from("suppliers").select("*").eq("user_id", userId);
    for (const s of (data ?? []) as SupplierRow[]) {
      if (supplierIds.includes(s.id)) suppliersById.set(s.id, s);
    }
  }

  const { data: links } = await supabase
    .from("worker_clients")
    .select("*")
    .eq("user_id", userId);
  const { data: projectClients } = await supabase
    .from("project_clients")
    .select("*")
    .eq("user_id", userId);
  const clientsById = new Map((projectClients ?? []).map((c: { id: string; name: string }) => [c.id, c]));

  const clientsByWorker = new Map<string, { id: string; name: string }[]>();
  for (const link of (links ?? []) as { worker_id: string; project_client_id: string }[]) {
    const client = clientsById.get(link.project_client_id);
    if (!client) continue;
    const list = clientsByWorker.get(link.worker_id) ?? [];
    list.push({ id: client.id, name: client.name });
    clientsByWorker.set(link.worker_id, list);
  }

  return rows.map((row) => ({
    ...row,
    supplier: row.supplier_id
      ? (() => {
          const s = suppliersById.get(row.supplier_id!);
          return s ? { id: s.id, name: s.name } : null;
        })()
      : null,
    clients: clientsByWorker.get(row.id) ?? [],
  }));
}

const _cachedListWorkers = unstable_cache(
  async (userId: string): Promise<WorkerListRow[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("workers")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });
    if (error || !data) return [];
    return attachRelations(supabase, userId, data as WorkerRow[]);
  },
  ["list-workers"],
  { revalidate: 60, tags: ["workers"] },
);

export async function listWorkers(): Promise<WorkerListRow[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedListWorkers(user.id);
}

export async function getWorkerById(id: string): Promise<WorkerListRow | null> {
  const { user } = await getServerContext();
  if (!user) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("workers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  const [withRelations] = await attachRelations(supabase, user.id, [data as WorkerRow]);
  return withRelations;
}
```

- [ ] **Step 5: Write the query test**

```ts
// lib/workers/worker-queries.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { getWorkerById } from "./worker-queries";

vi.mock("next/cache", () => ({ unstable_cache: vi.fn((fn: unknown) => fn) }));
vi.mock("@/lib/supabase/get-server-context", () => ({ getServerContext: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { createAdminClient } from "@/lib/supabase/admin";

describe("getWorkerById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when unauthenticated", async () => {
    vi.mocked(getServerContext).mockResolvedValue({ supabase: null, user: null } as never);
    const result = await getWorkerById("w1");
    expect(result).toBeNull();
  });

  it("returns null when the worker is not found", async () => {
    vi.mocked(getServerContext).mockResolvedValue({ user: { id: "u1" } } as never);
    const q = {
      select: vi.fn(() => q),
      eq: vi.fn(() => q),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
    };
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn(() => q) } as never);
    const result = await getWorkerById("missing-id");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run lib/workers/worker-queries.test.ts lib/workers/worker-tab.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/workers/worker-queries.ts lib/workers/worker-tab.ts lib/workers/worker-queries.test.ts lib/workers/worker-tab.test.ts
git commit -m "feat: add worker list/detail queries and tab routing"
```

---

## Task 7: Worker mutations (create/update/delete, client links)

**Files:**
- Create: `lib/workers/worker-mutations.ts`
- Test: `lib/workers/worker-mutations.test.ts`

**Interfaces:**
- Consumes: `workerInputSchema` from Task 3; `getServerContext`.
- Produces: `createWorker(raw: unknown): Promise<WorkerResult>`, `updateWorker(raw: unknown): Promise<WorkerResult>`, `deleteWorker(id: string): Promise<OkResult>`, where `WorkerResult = { ok: true; worker: WorkerRow } | { ok: false; error: string }`. Consumed by Task 12's worker form.

- [ ] **Step 1: Write the failing test**

```ts
// lib/workers/worker-mutations.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createWorker, deleteWorker } from "./worker-mutations";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: unknown) => fn),
}));
vi.mock("@/lib/supabase/get-server-context", () => ({ getServerContext: vi.fn() }));

function chain(result: { data: unknown; error: unknown }) {
  const q: Record<string, unknown> = {};
  q.insert = vi.fn(() => q);
  q.update = vi.fn(() => q);
  q.delete = vi.fn(() => q);
  q.select = vi.fn(() => q);
  q.eq = vi.fn(() => q);
  q.single = vi.fn(async () => result);
  return q;
}

describe("createWorker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an empty employee_id/name", async () => {
    const supabase = { from: vi.fn(() => chain({ data: null, error: null })) };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createWorker({ employee_id: "", name: "" });
    expect(result.ok).toBe(false);
  });

  it("surfaces a duplicate employee_id as a clean error, not a raw 23505", async () => {
    const supabase = {
      from: vi.fn(() => chain({ data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" } })),
    };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createWorker({ employee_id: "EMP/2026/0001", name: "Test" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("An employee with this ID already exists.");
    }
  });

  it("creates a worker with no document files attached", async () => {
    const row = { id: "w1", user_id: "u1", employee_id: "EMP/2026/0099", name: "Test", status: "available" };
    const supabase = { from: vi.fn(() => chain({ data: row, error: null })) };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createWorker({ employee_id: "EMP/2026/0099", name: "Test" });
    expect(result.ok).toBe(true);
  });
});

describe("deleteWorker", () => {
  it("rejects an invalid id", async () => {
    const result = await deleteWorker("not-a-uuid");
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/workers/worker-mutations.test.ts`
Expected: FAIL

- [ ] **Step 3: Write `lib/workers/worker-mutations.ts`**

```ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { workerInputSchema } from "@/lib/validations/worker";
import type { WorkerRow } from "@/types";

type WorkerResult =
  | { ok: true; worker: WorkerRow }
  | { ok: false; error: string };

type OkResult = { ok: true } | { ok: false; error: string };

const uuidSchema = z.string().uuid();

function revalidate() {
  revalidateTag("workers");
  revalidatePath("/workers");
}

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "23505" || error.message.includes("duplicate key")) {
    return "An employee with this ID already exists.";
  }
  return error.message;
}

function baseFields(parsed: ReturnType<typeof workerInputSchema.parse>) {
  return {
    employee_id: parsed.employee_id,
    name: parsed.name,
    nationality: parsed.nationality || null,
    trade_category: parsed.trade_category || null,
    status: parsed.status,
    supplier_id: parsed.supplier_id ?? null,
    notes: parsed.notes || null,
    passport_number: parsed.passport_number || null,
    passport_expiry: parsed.passport_expiry || null,
    emirates_id: parsed.emirates_id || null,
    emirates_id_expiry: parsed.emirates_id_expiry || null,
    visa_number: parsed.visa_number || null,
    visa_expiry: parsed.visa_expiry || null,
    medical_fit: parsed.medical_fit,
    medical_expiry: parsed.medical_expiry || null,
    has_insurance: parsed.has_insurance,
    insurance_expiry: parsed.insurance_expiry || null,
  };
}

async function syncWorkerClients(
  supabase: Awaited<ReturnType<typeof getServerContext>>["supabase"],
  userId: string,
  workerId: string,
  clientIds: string[],
) {
  await supabase.from("worker_clients").delete().eq("worker_id", workerId).eq("user_id", userId);
  if (clientIds.length === 0) return;
  await supabase.from("worker_clients").insert(
    clientIds.map((projectClientId) => ({
      user_id: userId,
      worker_id: workerId,
      project_client_id: projectClientId,
    })),
  );
}

export async function createWorker(raw: unknown): Promise<WorkerResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = workerInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { data, error } = await supabase
    .from("workers")
    .insert({ user_id: user.id, ...baseFields(parsed.data) })
    .select()
    .single();

  if (error) return { ok: false, error: friendlyError(error) };

  await syncWorkerClients(supabase, user.id, (data as WorkerRow).id, parsed.data.client_ids);

  revalidate();
  return { ok: true, worker: data as WorkerRow };
}

export async function updateWorker(raw: unknown): Promise<WorkerResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = workerInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  if (!parsed.data.id) return { ok: false, error: "Worker id required for update" };

  const { data, error } = await supabase
    .from("workers")
    .update(baseFields(parsed.data))
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { ok: false, error: friendlyError(error) };

  await syncWorkerClients(supabase, user.id, parsed.data.id, parsed.data.client_ids);

  revalidate();
  return { ok: true, worker: data as WorkerRow };
}

export async function updateWorkerStatus(id: string, status: string): Promise<WorkerResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { data, error } = await supabase
    .from("workers")
    .update({ status })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { ok: false, error: friendlyError(error) };
  revalidate();
  return { ok: true, worker: data as WorkerRow };
}

export async function deleteWorker(id: string): Promise<OkResult> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  await supabase.from("worker_clients").delete().eq("worker_id", parsed.data).eq("user_id", user.id);
  await supabase.from("worker_documents").delete().eq("worker_id", parsed.data).eq("user_id", user.id);

  const { error } = await supabase
    .from("workers")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/workers/worker-mutations.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/workers/worker-mutations.ts lib/workers/worker-mutations.test.ts
git commit -m "feat: add worker create/update/delete mutations"
```

---

## Task 8: Worker document mutations (upload/remove per slot + repeatable lists)

**Files:**
- Create: `lib/workers/worker-document-mutations.ts`
- Create: `lib/workers/worker-document-slots.ts`
- Test: `lib/workers/worker-document-mutations.test.ts`
- Test: `lib/workers/worker-document-slots.test.ts`

**Interfaces:**
- Consumes: mock storage via `supabase.storage.from(bucket)` (same API `lib/expenses/expense-mutations.ts` uses — see `extFromReceiptMime`/`validateReceiptFile` pattern there for the validation approach to mirror, not import, since the accepted mime list differs per entity).
- Produces: `WORKER_DOCUMENT_SLOTS` (single-file slots: `passport_document`, `passport_document_optional`, `emirates_id_document`, `emirates_id_document_optional`, `visa_document`, `visa_document_optional`, `photo`, `workmen_compensation_document`, `workmen_compensation_document_optional`, `medical_insurance_card`, `medical_insurance_card_optional`, `noc_current_sponsor_document`, `noc_client_document`, `trade_license_document`) each mapping to a `workers.<slot>_url` column; `uploadWorkerDocument(workerId: string, slot: WorkerDocumentSlot, formData: FormData): Promise<DocMutationResult>`; `removeWorkerDocument(workerId: string, slot: WorkerDocumentSlot): Promise<OkResult>`; `addWorkerDocumentListItem(workerId: string, category: "cicpa" | "additional", formData: FormData): Promise<DocMutationResult>`; `removeWorkerDocumentListItem(id: string): Promise<OkResult>`; `listWorkerDocuments(workerId: string): Promise<WorkerDocumentRow[]>`. Consumed by Task 13's Documents tab.

- [ ] **Step 1: Write `lib/workers/worker-document-slots.ts`**

```ts
export const WORKER_DOCUMENT_SLOTS = [
  "passport_document",
  "passport_document_optional",
  "emirates_id_document",
  "emirates_id_document_optional",
  "visa_document",
  "visa_document_optional",
  "photo",
  "workmen_compensation_document",
  "workmen_compensation_document_optional",
  "medical_insurance_card",
  "medical_insurance_card_optional",
  "noc_current_sponsor_document",
  "noc_client_document",
  "trade_license_document",
] as const;

export type WorkerDocumentSlot = (typeof WORKER_DOCUMENT_SLOTS)[number];

/** `photo` and the card slots don't follow the `<slot>_document_url`/`<slot>_url` split — this maps each slot to its actual column name. */
const SLOT_COLUMN_OVERRIDES: Partial<Record<WorkerDocumentSlot, string>> = {
  photo: "photo_url",
  medical_insurance_card: "medical_insurance_card_url",
  medical_insurance_card_optional: "medical_insurance_card_optional_url",
};

export function columnForSlot(slot: WorkerDocumentSlot): string {
  return SLOT_COLUMN_OVERRIDES[slot] ?? `${slot}_url`;
}

export const WORKER_DOCUMENT_ACCEPT = "image/png,image/jpeg,image/webp,application/pdf" as const;

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function extFromWorkerDocumentMime(mime: string): string | null {
  return EXT_BY_MIME[mime] ?? null;
}

export const MAX_WORKER_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

export function validateWorkerDocumentFile(file: File): string | null {
  if (file.size === 0) return `${file.name}: file is empty.`;
  if (file.size > MAX_WORKER_DOCUMENT_SIZE_BYTES) return `${file.name}: file exceeds 10MB.`;
  if (!extFromWorkerDocumentMime(file.type)) return `${file.name}: unsupported file type.`;
  return null;
}
```

- [ ] **Step 2: Write the slot-mapping test**

```ts
// lib/workers/worker-document-slots.test.ts
import { describe, expect, it } from "vitest";
import {
  WORKER_DOCUMENT_SLOTS,
  columnForSlot,
  validateWorkerDocumentFile,
} from "./worker-document-slots";

describe("columnForSlot", () => {
  it("maps standard slots to <slot>_url", () => {
    expect(columnForSlot("passport_document")).toBe("passport_document_url");
    expect(columnForSlot("trade_license_document")).toBe("trade_license_document_url");
  });

  it("maps photo and medical insurance card overrides", () => {
    expect(columnForSlot("photo")).toBe("photo_url");
    expect(columnForSlot("medical_insurance_card")).toBe("medical_insurance_card_url");
  });

  it("every declared slot resolves to a non-empty column", () => {
    for (const slot of WORKER_DOCUMENT_SLOTS) {
      expect(columnForSlot(slot).length).toBeGreaterThan(0);
    }
  });
});

describe("validateWorkerDocumentFile", () => {
  it("rejects an unsupported mime type", () => {
    const file = new File(["x"], "virus.exe", { type: "application/x-msdownload" });
    expect(validateWorkerDocumentFile(file)).toMatch(/unsupported file type/);
  });

  it("accepts a pdf", () => {
    const file = new File(["x"], "passport.pdf", { type: "application/pdf" });
    expect(validateWorkerDocumentFile(file)).toBeNull();
  });

  it("rejects an empty file", () => {
    const file = new File([], "empty.pdf", { type: "application/pdf" });
    expect(validateWorkerDocumentFile(file)).toMatch(/empty/);
  });
});
```

- [ ] **Step 3: Run test — verify it passes (pure logic, no mocking needed)**

Run: `npx vitest run lib/workers/worker-document-slots.test.ts`
Expected: PASS

- [ ] **Step 4: Write the failing mutation test**

```ts
// lib/workers/worker-document-mutations.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { removeWorkerDocument, uploadWorkerDocument } from "./worker-document-mutations";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock("@/lib/supabase/get-server-context", () => ({ getServerContext: vi.fn() }));

describe("uploadWorkerDocument", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects when no file is attached", async () => {
    const supabase = {} as never;
    vi.mocked(getServerContext).mockResolvedValue({ supabase, user: { id: "u1" } } as never);
    const fd = new FormData();
    const result = await uploadWorkerDocument("w1", "passport_document", fd);
    expect(result.ok).toBe(false);
  });

  it("rejects an unsupported file type", async () => {
    vi.mocked(getServerContext).mockResolvedValue({ supabase: {} as never, user: { id: "u1" } } as never);
    const fd = new FormData();
    fd.append("file", new File(["x"], "bad.exe", { type: "application/x-msdownload" }));
    const result = await uploadWorkerDocument("w1", "passport_document", fd);
    expect(result.ok).toBe(false);
  });

  it("uploads and writes the url column, succeeding with no prior file", async () => {
    const workerRow = { id: "w1", user_id: "u1" };
    const updateEq2 = vi.fn(async () => ({ error: null }));
    const updateEq1 = vi.fn(() => ({ eq: updateEq2 }));
    const workersQuery = {
      select: vi.fn(() => workersQuery),
      eq: vi.fn(() => workersQuery),
      maybeSingle: vi.fn(async () => ({ data: workerRow, error: null })),
      update: vi.fn(() => ({ eq: updateEq1 })),
    };
    const storage = {
      upload: vi.fn(async () => ({ data: { path: "u1/w1/x.pdf" }, error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: "/storage/v1/object/public/worker-documents/u1/w1/x.pdf" } })),
    };
    const supabase = {
      from: vi.fn(() => workersQuery),
      storage: { from: vi.fn(() => storage) },
    };
    vi.mocked(getServerContext).mockResolvedValue({ supabase: supabase as never, user: { id: "u1" } as never });

    const fd = new FormData();
    fd.append("file", new File(["x"], "passport.pdf", { type: "application/pdf" }));
    const result = await uploadWorkerDocument("w1", "passport_document", fd);

    expect(result.ok).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith("workers");
  });
});

describe("removeWorkerDocument", () => {
  it("rejects an invalid worker id", async () => {
    const result = await removeWorkerDocument("not-a-uuid", "passport_document");
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run lib/workers/worker-document-mutations.test.ts`
Expected: FAIL

- [ ] **Step 6: Write `lib/workers/worker-document-mutations.ts`**

```ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getServerContext } from "@/lib/supabase/get-server-context";
import {
  columnForSlot,
  extFromWorkerDocumentMime,
  validateWorkerDocumentFile,
  type WorkerDocumentSlot,
} from "@/lib/workers/worker-document-slots";
import type { WorkerDocumentRow } from "@/types";

const BUCKET = "worker-documents";
const uuidSchema = z.string().uuid();

type DocMutationResult = { ok: true; url: string } | { ok: false; error: string };
type OkResult = { ok: true } | { ok: false; error: string };

function revalidate() {
  revalidateTag("workers");
  revalidatePath("/workers");
}

export async function uploadWorkerDocument(
  workerId: string,
  slot: WorkerDocumentSlot,
  formData: FormData,
): Promise<DocMutationResult> {
  const parsedId = uuidSchema.safeParse(workerId);
  if (!parsedId.success) return { ok: false, error: "Invalid worker." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." };
  }

  const validationError = validateWorkerDocumentFile(file);
  if (validationError) return { ok: false, error: validationError };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Not authenticated." };

  const existing = await supabase
    .from("workers")
    .select("*")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing.error || !existing.data) return { ok: false, error: "Worker not found." };

  const ext = extFromWorkerDocumentMime(file.type)!;
  const path = `${user.id}/${parsedId.data}/${slot}-${crypto.randomUUID()}.${ext}`;

  const uploaded = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploaded.error) return { ok: false, error: uploaded.error.message };

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = publicUrlData.publicUrl;

  const column = columnForSlot(slot);
  const updated = await supabase
    .from("workers")
    .update({ [column]: url })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);
  if (updated.error) return { ok: false, error: updated.error.message };

  revalidate();
  return { ok: true, url };
}

export async function removeWorkerDocument(
  workerId: string,
  slot: WorkerDocumentSlot,
): Promise<OkResult> {
  const parsedId = uuidSchema.safeParse(workerId);
  if (!parsedId.success) return { ok: false, error: "Invalid worker." };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Not authenticated." };

  const column = columnForSlot(slot);
  const { error } = await supabase
    .from("workers")
    .update({ [column]: null })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function listWorkerDocuments(workerId: string): Promise<WorkerDocumentRow[]> {
  const { supabase, user } = await getServerContext();
  if (!user) return [];
  const { data, error } = await supabase
    .from("worker_documents")
    .select("*")
    .eq("worker_id", workerId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as WorkerDocumentRow[];
}

export async function addWorkerDocumentListItem(
  workerId: string,
  category: "cicpa" | "additional",
  formData: FormData,
): Promise<DocMutationResult> {
  const parsedId = uuidSchema.safeParse(workerId);
  if (!parsedId.success) return { ok: false, error: "Invalid worker." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." };
  }
  const validationError = validateWorkerDocumentFile(file);
  if (validationError) return { ok: false, error: validationError };

  const label = String(formData.get("label") ?? file.name).trim() || file.name;

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Not authenticated." };

  const ext = extFromWorkerDocumentMime(file.type)!;
  const path = `${user.id}/${parsedId.data}/${category}-${crypto.randomUUID()}.${ext}`;
  const uploaded = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploaded.error) return { ok: false, error: uploaded.error.message };

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = publicUrlData.publicUrl;

  const inserted = await supabase
    .from("worker_documents")
    .insert({ user_id: user.id, worker_id: parsedId.data, category, label, file_url: url });
  if (inserted.error) return { ok: false, error: inserted.error.message };

  revalidate();
  return { ok: true, url };
}

export async function removeWorkerDocumentListItem(id: string): Promise<OkResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid document." };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("worker_documents")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run lib/workers/worker-document-mutations.test.ts lib/workers/worker-document-slots.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add lib/workers/worker-document-mutations.ts lib/workers/worker-document-slots.ts lib/workers/worker-document-mutations.test.ts lib/workers/worker-document-slots.test.ts
git commit -m "feat: add worker document upload/remove mutations"
```

---

## Task 9: Shared document upload field component

**Files:**
- Create: `components/shared/document-upload-field.tsx`

**Interfaces:**
- Consumes: `Button`, `cn` from existing UI kit (same imports as `expense-form-sheet.tsx`).
- Produces: `DocumentUploadField` component — `{ label, accept, existingUrl, existingLabel, onFileSelected, onRemoveExisting, disabled? }` props. Consumed by Task 13's Worker Documents tab.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { FileText, Upload, X } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DocumentUploadFieldProps = {
  label: string;
  accept?: string;
  existingUrl: string | null;
  existingLabel?: string;
  pendingFile?: File | null;
  onFileSelected: (file: File) => void;
  onClearPending?: () => void;
  onRemoveExisting?: () => void;
  disabled?: boolean;
};

const DEFAULT_ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";

export function DocumentUploadField({
  label,
  accept = DEFAULT_ACCEPT,
  existingUrl,
  existingLabel,
  pendingFile,
  onFileSelected,
  onClearPending,
  onRemoveExisting,
  disabled = false,
}: DocumentUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>

      {existingUrl && !pendingFile && (
        <div
          className={cn(
            "flex items-center justify-between gap-2 rounded-md border border-border/80 bg-muted/30 px-3 py-2 text-sm",
          )}
        >
          <a
            href={existingUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-2 truncate text-foreground hover:underline"
          >
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{existingLabel ?? "Document"}</span>
          </a>
          {onRemoveExisting && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onRemoveExisting}
              aria-label={`Remove ${label}`}
            >
              <X />
            </Button>
          )}
        </div>
      )}

      {pendingFile && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span className="flex min-w-0 items-center gap-2 truncate">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{pendingFile.name}</span>
          </span>
          {onClearPending && !disabled && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={onClearPending} aria-label="Remove selected file">
              <X />
            </Button>
          )}
        </div>
      )}

      {!existingUrl && !pendingFile && (
        <label
          className={cn(
            "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border/80 px-3 py-4 text-sm text-muted-foreground hover:bg-muted/30",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <Upload className="size-4" />
          Choose from existing or drag and drop a file
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="sr-only"
            disabled={disabled}
            onChange={handleChange}
          />
        </label>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/shared/document-upload-field.tsx
git commit -m "feat: add shared DocumentUploadField component"
```

---

## Task 10: Suppliers UI (list + create/edit sheet)

**Files:**
- Create: `app/(app)/suppliers/page.tsx`
- Create: `components/features/suppliers/suppliers-manager.tsx`
- Create: `components/features/suppliers/supplier-form-sheet.tsx`

**Interfaces:**
- Consumes: `listSuppliers` (Task 4), `createSupplier`/`updateSupplier`/`deleteSupplier` (Task 4), `supplierInputSchema`/`SupplierInput`/`SUPPLIER_LIMITS` (Task 3), `SupplierRow` (Task 1).
- Produces: `/suppliers` route rendering a searchable table with Add/Edit/Delete.

- [ ] **Step 1: Write `components/features/suppliers/supplier-form-sheet.tsx`**

```tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createSupplier, updateSupplier } from "@/lib/suppliers/supplier-mutations";
import type { SupplierInput } from "@/lib/validations/supplier";
import { SUPPLIER_LIMITS } from "@/lib/validations/supplier";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { SupplierRow } from "@/types";

type SupplierFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: SupplierRow | null;
  onSuccess: () => void;
};

const emptyDefaults: SupplierInput = {
  name: "",
  supplier_code: "",
  license_number: "",
  vat_number: "",
  contact_name: "",
  email: "",
  phone: "",
  website: "",
  notes: "",
};

function supplierToFormValues(supplier: SupplierRow): SupplierInput {
  return {
    id: supplier.id,
    name: supplier.name,
    supplier_code: supplier.supplier_code ?? "",
    license_number: supplier.license_number ?? "",
    vat_number: supplier.vat_number ?? "",
    contact_name: supplier.contact_name ?? "",
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    website: supplier.website ?? "",
    notes: supplier.notes ?? "",
  };
}

export function SupplierFormSheet({ open, onOpenChange, supplier, onSuccess }: SupplierFormSheetProps) {
  const [isPending, startTransition] = useTransition();
  const mode = supplier ? "edit" : "create";

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierInput>({
    defaultValues: supplier ? supplierToFormValues(supplier) : emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;
    reset(supplier ? supplierToFormValues(supplier) : emptyDefaults);
  }, [open, supplier, reset]);

  function onSubmit(values: SupplierInput) {
    startTransition(async () => {
      const result = mode === "create" ? await createSupplier(values) : await updateSupplier(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(mode === "create" ? "Supplier added" : "Supplier updated");
      onOpenChange(false);
      onSuccess();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Add supplier" : "Edit supplier"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 px-6 pb-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="supplier-name">Name *</FieldLabel>
              <Input id="supplier-name" maxLength={SUPPLIER_LIMITS.name} {...register("name", { required: true })} />
              {errors.name && <p className="text-sm text-destructive">Name is required.</p>}
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-code">Supplier ID</FieldLabel>
              <Input id="supplier-code" maxLength={SUPPLIER_LIMITS.supplier_code} {...register("supplier_code")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-license">License number</FieldLabel>
              <Input id="supplier-license" maxLength={SUPPLIER_LIMITS.license_number} {...register("license_number")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-vat">VAT number</FieldLabel>
              <Input id="supplier-vat" maxLength={SUPPLIER_LIMITS.vat_number} {...register("vat_number")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-contact">Contact name</FieldLabel>
              <Input id="supplier-contact" maxLength={SUPPLIER_LIMITS.contact_name} {...register("contact_name")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-email">Email</FieldLabel>
              <Input id="supplier-email" type="email" maxLength={SUPPLIER_LIMITS.email} {...register("email")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-phone">Phone</FieldLabel>
              <Input id="supplier-phone" maxLength={SUPPLIER_LIMITS.phone} {...register("phone")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-website">Website</FieldLabel>
              <Input id="supplier-website" maxLength={SUPPLIER_LIMITS.website} {...register("website")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-notes">Notes</FieldLabel>
              <Textarea id="supplier-notes" maxLength={SUPPLIER_LIMITS.notes} {...register("notes")} />
            </Field>
          </FieldGroup>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={isPending}>
              {mode === "create" ? "Add supplier" : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Write `components/features/suppliers/suppliers-manager.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteSupplier } from "@/lib/suppliers/supplier-mutations";
import { SupplierFormSheet } from "@/components/features/suppliers/supplier-form-sheet";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import type { SupplierRow } from "@/types";

export function SuppliersManager({ initialSuppliers }: { initialSuppliers: SupplierRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierRow | null>(null);

  function handleDelete(supplier: SupplierRow) {
    startTransition(async () => {
      const result = await deleteSupplier(supplier.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Supplier deleted");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Suppliers"
        description="Labor-supply companies that provide workers."
        actions={
          <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
            <Plus /> Add supplier
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-border/80">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Supplier ID</th>
              <th className="px-4 py-3 font-medium">License</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {initialSuppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No suppliers yet.
                </td>
              </tr>
            )}
            {initialSuppliers.map((supplier) => (
              <tr key={supplier.id} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium">{supplier.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{supplier.supplier_code ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{supplier.license_number ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{supplier.contact_name ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(supplier); setSheetOpen(true); }}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    onClick={() => handleDelete(supplier)}
                    aria-label={`Delete ${supplier.name}`}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SupplierFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        supplier={editing}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
```

- [ ] **Step 3: Write `app/(app)/suppliers/page.tsx`**

```tsx
import type { Metadata } from "next";
import { SuppliersManager } from "@/components/features/suppliers/suppliers-manager";
import { listSuppliers } from "@/lib/suppliers/supplier-queries";

export const metadata: Metadata = { title: "Suppliers" };

export default async function SuppliersPage() {
  const suppliers = await listSuppliers();
  return <SuppliersManager initialSuppliers={suppliers} />;
}
```

If `PageHeader`'s prop name differs from `{ title, description, actions }` (check `components/shared/page-header.tsx`), adjust the call in `suppliers-manager.tsx` to match its actual signature before proceeding — do not introduce a second header component.

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint components/features/suppliers app/\(app\)/suppliers`
Expected: PASS

- [ ] **Step 5: Manual check**

Run: `npm run dev`, visit `/suppliers`, confirm the 3 seeded suppliers list, add one, edit one, delete one.

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/suppliers components/features/suppliers
git commit -m "feat: add Suppliers list and form UI"
```

---

## Task 11: Project Clients UI (list + create/edit sheet)

**Files:**
- Create: `app/(app)/project-clients/page.tsx`
- Create: `components/features/project-clients/project-clients-manager.tsx`
- Create: `components/features/project-clients/project-client-form-sheet.tsx`

**Interfaces:**
- Consumes: `listProjectClients`, `createProjectClient`/`updateProjectClient`/`deleteProjectClient` (Task 5), `projectClientInputSchema`/`PROJECT_CLIENT_LIMITS` (Task 3), `ProjectClientRow` (Task 1).
- Produces: `/project-clients` route. Structurally identical to Task 10 — copy its three files and do a mechanical rename: `Supplier → ProjectClient`, `supplier → projectClient`, `suppliers → project-clients`, field list `supplier_code/license_number/vat_number/contact_name/email/phone/website/notes` → `client_code/license_number/vat_number/contact_name/email/phone/website/notes` (only the code field's name changes).

- [ ] **Step 1: Write `components/features/project-clients/project-client-form-sheet.tsx`**

Same structure as Task 10 Step 1's `SupplierFormSheet`, with these substitutions: import `createProjectClient, updateProjectClient` from `@/lib/project-clients/project-client-mutations`; import `ProjectClientInput`, `PROJECT_CLIENT_LIMITS` from `@/lib/validations/project-client`; import `ProjectClientRow` from `@/types`; rename the component to `ProjectClientFormSheet`; rename `emptyDefaults`'s `supplier_code` field to `client_code`; rename `supplierToFormValues` to `projectClientToFormValues` reading `.client_code`; change the `id="supplier-code"` field's label to "Client ID" and htmlFor/id to `project-client-code`, `{...register("client_code")}`; prefix all other `id`s with `project-client-` instead of `supplier-`.

- [ ] **Step 2: Write `components/features/project-clients/project-clients-manager.tsx`**

Same structure as Task 10 Step 2's `SuppliersManager`, substituting: import `deleteProjectClient` from `@/lib/project-clients/project-client-mutations`; import `ProjectClientFormSheet`; rename component to `ProjectClientsManager`, prop `initialProjectClients: ProjectClientRow[]`; header title "Project clients", description "Construction companies workers are deployed to."; table header "Client ID" instead of "Supplier ID", reading `project_client.client_code`.

- [ ] **Step 3: Write `app/(app)/project-clients/page.tsx`**

```tsx
import type { Metadata } from "next";
import { ProjectClientsManager } from "@/components/features/project-clients/project-clients-manager";
import { listProjectClients } from "@/lib/project-clients/project-client-queries";

export const metadata: Metadata = { title: "Project clients" };

export default async function ProjectClientsPage() {
  const projectClients = await listProjectClients();
  return <ProjectClientsManager initialProjectClients={projectClients} />;
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint components/features/project-clients app/\(app\)/project-clients`
Expected: PASS

- [ ] **Step 5: Manual check**

Run: `npm run dev`, visit `/project-clients`, confirm the 2 seeded project clients list, add/edit/delete work.

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/project-clients components/features/project-clients
git commit -m "feat: add Project Clients list and form UI"
```

---

## Task 12: Workers list page + "Add worker" entry point

**Files:**
- Create: `app/(app)/workers/page.tsx`
- Create: `app/(app)/workers/loading.tsx`
- Create: `components/features/workers/workers-table.tsx`
- Create: `components/features/workers/add-worker-button.tsx`

**Interfaces:**
- Consumes: `listWorkers` (Task 6), `WorkerListRow` (Task 1), `WORKER_STATUS_LABELS` (Task 3).
- Produces: `/workers` route with a filterable/searchable table and a link to `/workers/new` (built in Task 14).

- [ ] **Step 1: Write `components/features/workers/add-worker-button.tsx`**

```tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddWorkerButton() {
  return (
    <Button nativeButton={false} render={<Link href="/workers/new" />}>
      <Plus />
      Add worker
    </Button>
  );
}
```

- [ ] **Step 2: Write `components/features/workers/workers-table.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { WORKER_STATUS_LABELS } from "@/lib/validations/worker";
import type { WorkerListRow } from "@/types";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  available: "default",
  deployed: "secondary",
  on_leave: "outline",
  inactive: "destructive",
};

export function WorkersTable({ workers }: { workers: WorkerListRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.employee_id.toLowerCase().includes(q) ||
        (w.nationality ?? "").toLowerCase().includes(q) ||
        (w.trade_category ?? "").toLowerCase().includes(q),
    );
  }, [workers, query]);

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search by name, employee ID, nationality, trade…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-hidden rounded-lg border border-border/80">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Employee ID</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Nationality</th>
              <th className="px-4 py-3 font-medium">Trade</th>
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No workers match your search.
                </td>
              </tr>
            )}
            {filtered.map((worker) => (
              <tr key={worker.id} className="border-t border-border/60 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <Link href={`/workers/${worker.id}`} className="font-medium hover:underline">
                    {worker.employee_id}
                  </Link>
                </td>
                <td className="px-4 py-3">{worker.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{worker.nationality ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{worker.trade_category ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{worker.supplier?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[worker.status] ?? "outline"}>
                    {WORKER_STATUS_LABELS[worker.status]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

If `Badge` doesn't accept a `variant` prop in this codebase (check `components/ui/badge.tsx`), drop the `variant` usage and render a plain `<Badge>{label}</Badge>` instead — don't invent a prop the component doesn't support.

- [ ] **Step 3: Write `app/(app)/workers/page.tsx`**

```tsx
import type { Metadata } from "next";
import { AddWorkerButton } from "@/components/features/workers/add-worker-button";
import { WorkersTable } from "@/components/features/workers/workers-table";
import { PageHeader } from "@/components/shared/page-header";
import { listWorkers } from "@/lib/workers/worker-queries";

export const metadata: Metadata = { title: "Workers" };

export default async function WorkersPage() {
  const workers = await listWorkers();
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Workers"
        description="Worker / employee registry."
        actions={<AddWorkerButton />}
      />
      <WorkersTable workers={workers} />
    </div>
  );
}
```

- [ ] **Step 4: Write `app/(app)/workers/loading.tsx`**

Mirror `app/(app)/clients/loading.tsx` exactly — read it first and copy its skeleton structure, swapping copy from "clients" to "workers".

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint components/features/workers app/\(app\)/workers`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/workers/page.tsx app/\(app\)/workers/loading.tsx components/features/workers/workers-table.tsx components/features/workers/add-worker-button.tsx
git commit -m "feat: add Workers list page"
```

---

## Task 13: Worker create/edit form (Details tab fields)

**Files:**
- Create: `app/(app)/workers/new/page.tsx`
- Create: `app/(app)/workers/new/loading.tsx`
- Create: `app/(app)/workers/[id]/edit/page.tsx`
- Create: `app/(app)/workers/[id]/edit/loading.tsx`
- Create: `components/features/workers/worker-form.tsx`

**Interfaces:**
- Consumes: `createWorker`/`updateWorker` (Task 7), `workerInputSchema`/`WorkerInput`/`WORKER_LIMITS`/`WORKER_STATUSES`/`WORKER_STATUS_LABELS` (Task 3), `listSuppliers` (Task 4), `listProjectClients` (Task 5), `WorkerListRow` (Task 1).
- Produces: `/workers/new` and `/workers/[id]/edit` routes; `WorkerForm` component handling both modes, redirecting to `/workers/[id]` on success.

- [ ] **Step 1: Write `components/features/workers/worker-form.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createWorker, updateWorker } from "@/lib/workers/worker-mutations";
import { WORKER_LIMITS, WORKER_STATUSES, WORKER_STATUS_LABELS, type WorkerInput } from "@/lib/validations/worker";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectClientRow, SupplierRow, WorkerListRow } from "@/types";

type WorkerFormProps =
  | { mode: "create"; suppliers: SupplierRow[]; projectClients: ProjectClientRow[] }
  | { mode: "edit"; worker: WorkerListRow; suppliers: SupplierRow[]; projectClients: ProjectClientRow[] };

const emptyDefaults: WorkerInput = {
  employee_id: "",
  name: "",
  nationality: "",
  trade_category: "",
  status: "available",
  supplier_id: null,
  client_ids: [],
  notes: "",
  passport_number: "",
  passport_expiry: "",
  emirates_id: "",
  emirates_id_expiry: "",
  visa_number: "",
  visa_expiry: "",
  medical_fit: false,
  medical_expiry: "",
  has_insurance: false,
  insurance_expiry: "",
};

function workerToFormValues(worker: WorkerListRow): WorkerInput {
  return {
    id: worker.id,
    employee_id: worker.employee_id,
    name: worker.name,
    nationality: worker.nationality ?? "",
    trade_category: worker.trade_category ?? "",
    status: worker.status,
    supplier_id: worker.supplier_id,
    client_ids: worker.clients.map((c) => c.id),
    notes: worker.notes ?? "",
    passport_number: worker.passport_number ?? "",
    passport_expiry: worker.passport_expiry ?? "",
    emirates_id: worker.emirates_id ?? "",
    emirates_id_expiry: worker.emirates_id_expiry ?? "",
    visa_number: worker.visa_number ?? "",
    visa_expiry: worker.visa_expiry ?? "",
    medical_fit: worker.medical_fit,
    medical_expiry: worker.medical_expiry ?? "",
    has_insurance: worker.has_insurance,
    insurance_expiry: worker.insurance_expiry ?? "",
  };
}

export function WorkerForm(props: WorkerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(
    props.mode === "edit" ? props.worker.clients.map((c) => c.id) : [],
  );

  const defaults = props.mode === "edit" ? workerToFormValues(props.worker) : emptyDefaults;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<WorkerInput>({
    defaultValues: defaults,
  });

  function toggleClient(id: string) {
    setSelectedClientIds((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      setValue("client_ids", next);
      return next;
    });
  }

  function onSubmit(values: WorkerInput) {
    startTransition(async () => {
      const payload = { ...values, client_ids: selectedClientIds };
      const result =
        props.mode === "create"
          ? await createWorker(payload)
          : await updateWorker({ ...payload, id: props.worker.id });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(props.mode === "create" ? "Worker added" : "Worker updated");
      router.push(`/workers/${result.worker.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="worker-employee-id">Employee ID *</FieldLabel>
          <Input
            id="worker-employee-id"
            maxLength={WORKER_LIMITS.employee_id}
            disabled={props.mode === "edit"}
            {...register("employee_id", { required: true })}
          />
          {errors.employee_id && <p className="text-sm text-destructive">Employee ID is required.</p>}
        </Field>
        <Field>
          <FieldLabel htmlFor="worker-name">Name *</FieldLabel>
          <Input id="worker-name" maxLength={WORKER_LIMITS.name} {...register("name", { required: true })} />
          {errors.name && <p className="text-sm text-destructive">Name is required.</p>}
        </Field>
        <Field>
          <FieldLabel htmlFor="worker-nationality">Nationality</FieldLabel>
          <Input id="worker-nationality" maxLength={WORKER_LIMITS.nationality} {...register("nationality")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="worker-trade">Trade category</FieldLabel>
          <Input id="worker-trade" maxLength={WORKER_LIMITS.trade_category} {...register("trade_category")} />
        </Field>

        <Field>
          <FieldLabel htmlFor="worker-supplier">Supplier</FieldLabel>
          <Select
            value={watch("supplier_id") ?? ""}
            onValueChange={(v) => setValue("supplier_id", v || null)}
          >
            <SelectTrigger id="worker-supplier">
              {props.suppliers.find((s) => s.id === watch("supplier_id"))?.name ?? "Leave blank for internal workers"}
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="">No supplier</SelectItem>
                {props.suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Clients</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {props.projectClients.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleClient(c.id)}
                className={
                  selectedClientIds.includes(c.id)
                    ? "rounded-full border border-primary bg-primary/10 px-3 py-1 text-sm text-primary"
                    : "rounded-full border border-border/80 px-3 py-1 text-sm text-muted-foreground"
                }
              >
                {c.name}
              </button>
            ))}
            {props.projectClients.length === 0 && (
              <p className="text-sm text-muted-foreground">No project clients yet.</p>
            )}
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="worker-status">Status *</FieldLabel>
          <Select value={watch("status")} onValueChange={(v) => setValue("status", v as WorkerInput["status"])}>
            <SelectTrigger id="worker-status">{WORKER_STATUS_LABELS[watch("status")]}</SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {WORKER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{WORKER_STATUS_LABELS[status]}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="worker-notes">Notes</FieldLabel>
          <Textarea id="worker-notes" maxLength={WORKER_LIMITS.notes} {...register("notes")} />
        </Field>
      </FieldGroup>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {props.mode === "create" ? "Add worker" : "Save changes"}
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/workers" />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

If `Select`'s actual API differs from `value`/`onValueChange`/children shape assumed here (check `components/ui/select.tsx`, since `expense-form-sheet.tsx` used `Controller` for its Select — grep that file for how it wires `Select` with react-hook-form), adjust this form's Select usage to match the real component's API exactly rather than guessing.

- [ ] **Step 2: Write `app/(app)/workers/new/page.tsx`**

```tsx
import type { Metadata } from "next";
import { WorkerForm } from "@/components/features/workers/worker-form";
import { FormPageShell } from "@/components/shared/form-page-shell";
import { PageHeader } from "@/components/shared/page-header";
import { listProjectClients } from "@/lib/project-clients/project-client-queries";
import { listSuppliers } from "@/lib/suppliers/supplier-queries";

export const metadata: Metadata = { title: "New worker" };

export default async function NewWorkerPage() {
  const [suppliers, projectClients] = await Promise.all([listSuppliers(), listProjectClients()]);
  return (
    <FormPageShell maxWidth="3xl">
      <div className="flex flex-col gap-8">
        <PageHeader
          backHref="/workers"
          backLabel="Workers"
          title="New worker"
          description="Add a worker to the registry. Documents can be attached after saving."
        />
        <WorkerForm mode="create" suppliers={suppliers} projectClients={projectClients} />
      </div>
    </FormPageShell>
  );
}
```

- [ ] **Step 3: Write `app/(app)/workers/new/loading.tsx`**

Mirror `app/(app)/clients/new/loading.tsx`.

- [ ] **Step 4: Write `app/(app)/workers/[id]/edit/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkerForm } from "@/components/features/workers/worker-form";
import { FormPageShell } from "@/components/shared/form-page-shell";
import { PageHeader } from "@/components/shared/page-header";
import { listProjectClients } from "@/lib/project-clients/project-client-queries";
import { listSuppliers } from "@/lib/suppliers/supplier-queries";
import { getWorkerById } from "@/lib/workers/worker-queries";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const worker = await getWorkerById(id);
  return { title: worker ? `Edit ${worker.name}` : "Edit worker" };
}

export default async function EditWorkerPage({ params }: PageProps) {
  const { id } = await params;
  const [worker, suppliers, projectClients] = await Promise.all([
    getWorkerById(id),
    listSuppliers(),
    listProjectClients(),
  ]);
  if (!worker) notFound();

  return (
    <FormPageShell maxWidth="3xl">
      <div className="flex flex-col gap-8">
        <PageHeader
          backHref={`/workers/${id}`}
          backLabel={worker.name}
          title="Edit worker"
          description="Update this worker's details."
        />
        <WorkerForm mode="edit" worker={worker} suppliers={suppliers} projectClients={projectClients} />
      </div>
    </FormPageShell>
  );
}
```

- [ ] **Step 5: Write `app/(app)/workers/[id]/edit/loading.tsx`**

Mirror `app/(app)/clients/[id]/edit/loading.tsx`.

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint components/features/workers app/\(app\)/workers`
Expected: PASS

- [ ] **Step 7: Manual check**

Run: `npm run dev`, visit `/workers/new`, create a worker with an employee ID matching an existing seed (`EMP/2026/0001`) — confirm the duplicate-ID error surfaces cleanly in the toast, not a raw DB error. Then create one with a fresh ID, confirm it redirects to the detail page (detail page doesn't exist yet until Task 14 — expect a 404 here, which is fine; just confirm the worker row was created by checking `/workers`).

- [ ] **Step 8: Commit**

```bash
git add app/\(app\)/workers/new app/\(app\)/workers/\[id\]/edit components/features/workers/worker-form.tsx
git commit -m "feat: add Worker create/edit form"
```

---

## Task 14: Worker detail page shell + Details tab

**Files:**
- Create: `app/(app)/workers/[id]/page.tsx`
- Create: `app/(app)/workers/[id]/loading.tsx`
- Create: `app/(app)/workers/[id]/layout.tsx`
- Create: `components/features/workers/detail/worker-detail.tsx`
- Create: `components/features/workers/detail/worker-detail-view.tsx`
- Create: `components/features/workers/detail/worker-details-tab.tsx`

**Interfaces:**
- Consumes: `getWorkerById` (Task 6), `parseWorkerTab`/`WorkerTab`/`WORKER_TABS` (Task 6), `deleteWorker`/`updateWorkerStatus` (Task 7), `WORKER_STATUS_LABELS` (Task 3).
- Produces: `/workers/[id]` route with a tab bar; `WorkerDetailView` renders the active tab, consumed as the shell by Task 15 (Documents) and Task 16 (Accommodation/Timesheets), which plug into the same tab switch.

- [ ] **Step 1: Read `components/features/clients/detail/client-detail-view.tsx` in full first**

This file isn't summarized elsewhere in this plan — read it directly before writing `worker-detail-view.tsx`, since the tab-bar markup, header layout (name/breadcrumb/Edit button/status panel), and `Tabs` component usage must be copied structurally, not re-invented. Note the exact `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` import paths and prop names it uses.

- [ ] **Step 2: Write `components/features/workers/detail/worker-details-tab.tsx`**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { WorkerListRow } from "@/types";

export function WorkerDetailsTab({ worker }: { worker: WorkerListRow }) {
  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Employee ID</dt>
          <dd className="font-medium">{worker.employee_id}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Nationality</dt>
          <dd className="font-medium">{worker.nationality ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Trade category</dt>
          <dd className="font-medium">{worker.trade_category ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Supplier</dt>
          <dd className="font-medium">{worker.supplier?.name ?? "Internal worker"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-muted-foreground">Clients</dt>
          <dd className="flex flex-wrap gap-2 pt-1">
            {worker.clients.length === 0 && <span className="text-muted-foreground">No clients linked</span>}
            {worker.clients.map((c) => (
              <span key={c.id} className="rounded-full border border-border/80 px-3 py-1 text-sm">{c.name}</span>
            ))}
          </dd>
        </div>
        {worker.notes && (
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Notes</dt>
            <dd className="whitespace-pre-wrap">{worker.notes}</dd>
          </div>
        )}
      </dl>
      <Button variant="outline" nativeButton={false} render={<Link href={`/workers/${worker.id}/edit`} />} className="w-fit">
        Edit details
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Write `components/features/workers/detail/worker-detail-view.tsx`**

Structure this after `client-detail-view.tsx` read in Step 1: a header (name as title, employee ID as subtitle, "Edit" button linking to `/workers/[id]/edit`, a status `Select` wired to `updateWorkerStatus` matching the reference screenshot's right-hand status panel), a `Tabs` bar with triggers for `WORKER_TABS` (Details/Documents/Accommodation/Timesheets) that update the URL's `?tab=` query param via `router.push` (mirror exactly how `client-detail-view.tsx` does tab navigation — same pattern, do not invent a new one), and a content area that renders `<WorkerDetailsTab worker={worker} />` for `"details"`, and for `"documents" | "accommodation" | "timesheets"` renders a placeholder `<div className="text-muted-foreground">Loading…</div>` for now — Task 15 and Task 16 replace those two branches.

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateWorkerStatus } from "@/lib/workers/worker-mutations";
import { WORKER_STATUSES, WORKER_STATUS_LABELS } from "@/lib/validations/worker";
import type { WorkerTab } from "@/lib/workers/worker-tab";
import type { WorkerListRow } from "@/types";

import { WorkerDetailsTab } from "@/components/features/workers/detail/worker-details-tab";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function WorkerDetailView({ worker, tab }: { worker: WorkerListRow; tab: WorkerTab }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onTabChange(next: string) {
    router.push(`/workers/${worker.id}?tab=${next}`);
  }

  function onStatusChange(next: string) {
    startTransition(async () => {
      const result = await updateWorkerStatus(worker.id, next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:flex-row lg:gap-10">
      <div className="min-w-0 flex-1">
        <h1 className="font-heading text-2xl tracking-tight">{worker.name}</h1>
        <p className="text-muted-foreground">Worker / employee registry.</p>

        <Tabs value={tab} onValueChange={onTabChange} className="mt-6">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="accommodation">Accommodation</TabsTrigger>
            <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
          </TabsList>

          {tab === "details" && <WorkerDetailsTab worker={worker} />}
          {tab === "documents" && <div className="text-muted-foreground">Loading…</div>}
          {tab === "accommodation" && <div className="text-muted-foreground">Loading…</div>}
          {tab === "timesheets" && <div className="text-muted-foreground">Loading…</div>}
        </Tabs>
      </div>

      <div className="w-full shrink-0 lg:w-64">
        <label className="text-sm font-medium text-muted-foreground" htmlFor="worker-status-select">Status</label>
        <Select value={worker.status} onValueChange={onStatusChange} disabled={isPending}>
          <SelectTrigger id="worker-status-select">{WORKER_STATUS_LABELS[worker.status]}</SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {WORKER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{WORKER_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

Reconcile this against what Step 1 actually found in `client-detail-view.tsx` — if `Tabs`'s real API doesn't take `value`/`onValueChange` the way assumed, or `TabsList`/`TabsTrigger` render differently, match the real component exactly.

- [ ] **Step 4: Write `components/features/workers/detail/worker-detail.tsx`**

```tsx
import { notFound } from "next/navigation";
import { WorkerDetailView } from "@/components/features/workers/detail/worker-detail-view";
import type { WorkerTab } from "@/lib/workers/worker-tab";
import { getWorkerById } from "@/lib/workers/worker-queries";

export async function WorkerDetail({ id, tab = "details" }: { id: string; tab?: WorkerTab }) {
  const worker = await getWorkerById(id);
  if (!worker) {
    notFound();
  }
  return <WorkerDetailView worker={worker} tab={tab} />;
}
```

- [ ] **Step 5: Write `app/(app)/workers/[id]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { WorkerDetail } from "@/components/features/workers/detail/worker-detail";
import { parseWorkerTab } from "@/lib/workers/worker-tab";
import { getWorkerById } from "@/lib/workers/worker-queries";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const worker = await getWorkerById(id);
  return { title: worker?.name ?? "Worker" };
}

export default async function WorkerDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  return <WorkerDetail id={id} tab={parseWorkerTab(tab)} />;
}
```

- [ ] **Step 6: Write `app/(app)/workers/[id]/loading.tsx` and `app/(app)/workers/[id]/layout.tsx`**

Mirror `app/(app)/clients/[id]/loading.tsx` and check whether `app/(app)/clients/[id]/layout.tsx` exists (it wasn't listed in the earlier file scan — if `clients/[id]` has no `layout.tsx`, skip creating one here too; don't add a file the mirrored feature doesn't have).

- [ ] **Step 7: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint components/features/workers app/\(app\)/workers`
Expected: PASS

- [ ] **Step 8: Manual check**

Run: `npm run dev`, visit `/workers`, click a seeded worker, confirm the Details tab renders employee ID/nationality/trade/supplier/clients, status select updates and persists on refresh, Edit button navigates to the edit form, and `/workers/does-not-exist` 404s.

- [ ] **Step 9: Commit**

```bash
git add app/\(app\)/workers/\[id\]/page.tsx app/\(app\)/workers/\[id\]/loading.tsx components/features/workers/detail
git commit -m "feat: add Worker detail page with Details tab"
```

---

## Task 15: Worker Documents tab

**Files:**
- Create: `components/features/workers/detail/worker-documents-tab.tsx`
- Create: `components/features/workers/detail/document-list-section.tsx`
- Modify: `components/features/workers/detail/worker-detail-view.tsx:` the `tab === "documents"` branch from Task 14

**Interfaces:**
- Consumes: `DocumentUploadField` (Task 9), `uploadWorkerDocument`/`removeWorkerDocument` (Task 8), `listWorkerDocuments`/`addWorkerDocumentListItem`/`removeWorkerDocumentListItem` (Task 8), `WORKER_DOCUMENT_ACCEPT` (Task 8), `WorkerDocumentRow` (Task 1).

- [ ] **Step 1: Write `components/features/workers/detail/document-list-section.tsx`** (CICPA / Additional Documents repeatable lists)

```tsx
"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { FileText, Plus, X } from "lucide-react";

import { addWorkerDocumentListItem, removeWorkerDocumentListItem } from "@/lib/workers/worker-document-mutations";
import { WORKER_DOCUMENT_ACCEPT } from "@/lib/workers/worker-document-slots";
import { Button } from "@/components/ui/button";
import type { WorkerDocumentRow } from "@/types";

type DocumentListSectionProps = {
  workerId: string;
  category: "cicpa" | "additional";
  title: string;
  description?: string;
  documents: WorkerDocumentRow[];
  onChanged: () => void;
};

export function DocumentListSection({ workerId, category, title, description, documents, onChanged }: DocumentListSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleFile(file: File) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("label", file.name);
      const result = await addWorkerDocumentListItem(workerId, category, fd);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Document added");
      onChanged();
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const result = await removeWorkerDocumentListItem(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChanged();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/80 p-4">
      <div>
        <h3 className="font-medium">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm">
          <a href={doc.file_url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 truncate hover:underline">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{doc.label}</span>
          </a>
          <Button type="button" variant="ghost" size="icon-sm" disabled={isPending} onClick={() => handleRemove(doc.id)} aria-label={`Remove ${doc.label}`}>
            <X />
          </Button>
        </div>
      ))}

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-primary">
        <Plus className="size-4" /> Add document
        <input
          ref={inputRef}
          type="file"
          accept={WORKER_DOCUMENT_ACCEPT}
          className="sr-only"
          disabled={isPending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 2: Write `components/features/workers/detail/worker-documents-tab.tsx`**

```tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  listWorkerDocuments,
  removeWorkerDocument,
  uploadWorkerDocument,
} from "@/lib/workers/worker-document-mutations";
import { WORKER_DOCUMENT_ACCEPT, type WorkerDocumentSlot } from "@/lib/workers/worker-document-slots";
import { DocumentUploadField } from "@/components/shared/document-upload-field";
import { DocumentListSection } from "@/components/features/workers/detail/document-list-section";
import type { WorkerDocumentRow, WorkerListRow } from "@/types";

type SlotGroup = { title: string; slot: WorkerDocumentSlot; url: string | null; label: string };

function groupsFor(worker: WorkerListRow): { heading: string; fields: SlotGroup[] }[] {
  return [
    {
      heading: "Passport",
      fields: [
        { title: "Passport Copy", slot: "passport_document", url: worker.passport_document_url, label: "Passport" },
        { title: "Passport Copy (optional)", slot: "passport_document_optional", url: worker.passport_document_optional_url, label: "Passport (optional)" },
      ],
    },
    {
      heading: "Emirates ID (EID)",
      fields: [
        { title: "EID Copy", slot: "emirates_id_document", url: worker.emirates_id_document_url, label: "Emirates ID" },
        { title: "EID Copy (optional)", slot: "emirates_id_document_optional", url: worker.emirates_id_document_optional_url, label: "Emirates ID (optional)" },
      ],
    },
    {
      heading: "Visa",
      fields: [
        { title: "Visa Copy", slot: "visa_document", url: worker.visa_document_url, label: "Visa" },
        { title: "Visa Copy (optional)", slot: "visa_document_optional", url: worker.visa_document_optional_url, label: "Visa (optional)" },
      ],
    },
    {
      heading: "Photo & Insurance",
      fields: [
        { title: "Photo", slot: "photo", url: worker.photo_url, label: "Photo" },
        { title: "Workmen Compensation", slot: "workmen_compensation_document", url: worker.workmen_compensation_document_url, label: "Workmen Compensation" },
        { title: "Workmen Compensation (optional)", slot: "workmen_compensation_document_optional", url: worker.workmen_compensation_document_optional_url, label: "Workmen Compensation (optional)" },
        { title: "Medical Insurance Card", slot: "medical_insurance_card", url: worker.medical_insurance_card_url, label: "Medical Insurance Card" },
        { title: "Medical Insurance Card (optional)", slot: "medical_insurance_card_optional", url: worker.medical_insurance_card_optional_url, label: "Medical Insurance Card (optional)" },
      ],
    },
    {
      heading: "Sponsor & Trade License",
      fields: [
        { title: "NOC — Current Sponsor", slot: "noc_current_sponsor_document", url: worker.noc_current_sponsor_document_url, label: "NOC — Current Sponsor" },
        { title: "NOC — Client", slot: "noc_client_document", url: worker.noc_client_document_url, label: "NOC — Client" },
        { title: "Trade License", slot: "trade_license_document", url: worker.trade_license_document_url, label: "Trade License" },
      ],
    },
  ];
}

export function WorkerDocumentsTab({ worker }: { worker: WorkerListRow }) {
  const [isPending, startTransition] = useTransition();
  const [documents, setDocuments] = useState<WorkerDocumentRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function refreshDocuments() {
    const docs = await listWorkerDocuments(worker.id);
    setDocuments(docs);
  }

  useEffect(() => {
    refreshDocuments().then(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worker.id]);

  function handleUpload(slot: WorkerDocumentSlot, file: File) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadWorkerDocument(worker.id, slot, fd);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Document uploaded");
      window.location.reload();
    });
  }

  function handleRemove(slot: WorkerDocumentSlot) {
    startTransition(async () => {
      const result = await removeWorkerDocument(worker.id, slot);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Document removed");
      window.location.reload();
    });
  }

  if (!loaded) {
    return <div className="text-muted-foreground">Loading documents…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {groupsFor(worker).map((group) => (
        <div key={group.heading} className="flex flex-col gap-4 rounded-lg border border-border/80 p-4">
          <h3 className="font-medium">{group.heading}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <DocumentUploadField
                key={field.slot}
                label={field.title}
                accept={WORKER_DOCUMENT_ACCEPT}
                existingUrl={field.url}
                existingLabel={field.label}
                disabled={isPending}
                onFileSelected={(file) => handleUpload(field.slot, file)}
                onRemoveExisting={() => handleRemove(field.slot)}
              />
            ))}
          </div>
        </div>
      ))}

      <DocumentListSection
        workerId={worker.id}
        category="cicpa"
        title="CICPA Documents"
        documents={documents.filter((d) => d.category === "cicpa")}
        onChanged={refreshDocuments}
      />
      <DocumentListSection
        workerId={worker.id}
        category="additional"
        title="Additional Documents"
        description="Any other documents required by the client."
        documents={documents.filter((d) => d.category === "additional")}
        onChanged={refreshDocuments}
      />
    </div>
  );
}
```

`window.location.reload()` after each slot upload/remove is a deliberate simplification (the parent `WorkerListRow` prop is server-fetched, not client-refetchable per-field without more plumbing) — acceptable for this round since the spec doesn't require optimistic updates.

- [ ] **Step 3: Wire the tab into `worker-detail-view.tsx`**

In `components/features/workers/detail/worker-detail-view.tsx`, replace:

```tsx
          {tab === "documents" && <div className="text-muted-foreground">Loading…</div>}
```

with:

```tsx
          {tab === "documents" && <WorkerDocumentsTab worker={worker} />}
```

and add the import:

```tsx
import { WorkerDocumentsTab } from "@/components/features/workers/detail/worker-documents-tab";
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint components/features/workers`
Expected: PASS

- [ ] **Step 5: Manual check**

Run: `npm run dev`, open a worker, switch to Documents, upload a passport PDF, confirm it appears and is removable; add a CICPA document and an Additional document, confirm both list correctly; attempt uploading a `.exe` and confirm the error toast fires and nothing is saved.

- [ ] **Step 6: Commit**

```bash
git add components/features/workers/detail/worker-documents-tab.tsx components/features/workers/detail/document-list-section.tsx components/features/workers/detail/worker-detail-view.tsx
git commit -m "feat: add Worker Documents tab with per-slot and repeatable uploads"
```

---

## Task 16: Worker Accommodation and Timesheets stub tabs

**Files:**
- Create: `components/features/workers/detail/worker-accommodation-tab.tsx`
- Create: `components/features/workers/detail/worker-timesheets-tab.tsx`
- Modify: `components/features/workers/detail/worker-detail-view.tsx`

**Interfaces:**
- Produces: static empty-state components for the two stub tabs, wired into the same tab switch Task 14 set up.

- [ ] **Step 1: Write `components/features/workers/detail/worker-accommodation-tab.tsx`**

```tsx
import { Home } from "lucide-react";

export function WorkerAccommodationTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 px-6 py-16 text-center">
      <Home className="size-8 text-muted-foreground" />
      <p className="font-medium">No accommodation assigned yet</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Camp and room assignment isn&apos;t set up yet. This tab will show the worker&apos;s bed allocation once that&apos;s added.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Write `components/features/workers/detail/worker-timesheets-tab.tsx`**

```tsx
import { Clock } from "lucide-react";

export function WorkerTimesheetsTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 px-6 py-16 text-center">
      <Clock className="size-8 text-muted-foreground" />
      <p className="font-medium">No timesheets recorded yet</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Timesheet tracking isn&apos;t set up yet. This tab will show logged hours once that&apos;s added.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Wire both into `worker-detail-view.tsx`**

Replace:

```tsx
          {tab === "accommodation" && <div className="text-muted-foreground">Loading…</div>}
          {tab === "timesheets" && <div className="text-muted-foreground">Loading…</div>}
```

with:

```tsx
          {tab === "accommodation" && <WorkerAccommodationTab />}
          {tab === "timesheets" && <WorkerTimesheetsTab />}
```

and add imports:

```tsx
import { WorkerAccommodationTab } from "@/components/features/workers/detail/worker-accommodation-tab";
import { WorkerTimesheetsTab } from "@/components/features/workers/detail/worker-timesheets-tab";
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint components/features/workers`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/features/workers/detail/worker-accommodation-tab.tsx components/features/workers/detail/worker-timesheets-tab.tsx components/features/workers/detail/worker-detail-view.tsx
git commit -m "feat: add Worker Accommodation and Timesheets stub tabs"
```

---

## Task 17: Navigation wiring

**Files:**
- Modify: `config/nav.ts`

**Interfaces:**
- Consumes: existing `PANE_CONFIGS`, `ROUTE_TO_SECTION`, `ROUTE_LABELS` structures.
- Produces: `/workers`, `/suppliers`, `/project-clients` reachable from the sidebar under a "Manpower" section inside the `work` pane.

- [ ] **Step 1: Add icon imports**

In `config/nav.ts`, add to the `lucide-react` import list: `HardHat, Building2, Truck` (pick icons not already imported — check the existing import list first and avoid duplicates; `Users` is already imported and used by Clients, so don't reuse it for Workers to keep sections visually distinct).

- [ ] **Step 2: Add a "Manpower" section to the `work` pane**

In `PANE_CONFIGS.work.sections`, after the existing `"CRM"` section and before `"Documents"`, add:

```ts
      {
        label: "Manpower",
        items: [
          { id: "workers",         icon: HardHat,   label: "Workers",         href: "/workers" },
          { id: "suppliers",       icon: Truck,     label: "Suppliers",       href: "/suppliers" },
          { id: "project-clients", icon: Building2, label: "Project clients", href: "/project-clients" },
        ],
      },
```

- [ ] **Step 3: Add route-to-section and breadcrumb entries**

In `ROUTE_TO_SECTION`, add:

```ts
  "/workers":         "work",
  "/suppliers":       "work",
  "/project-clients": "work",
```

In `ROUTE_LABELS`, add:

```ts
  "/workers":         ["Work", "Workers"],
  "/suppliers":       ["Work", "Suppliers"],
  "/project-clients": ["Work", "Project clients"],
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Manual check**

Run: `npm run dev`, confirm Workers/Suppliers/Project clients appear in the sidebar under a "Manpower" heading in the Work pane, and clicking each navigates correctly with the right breadcrumb.

- [ ] **Step 6: Commit**

```bash
git add config/nav.ts
git commit -m "feat: add Workers/Suppliers/Project clients to navigation"
```

---

## Task 18: Full suite verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — all new and existing tests green.

- [ ] **Step 2: Run typecheck and lint across the whole repo**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS

- [ ] **Step 3: Run a production build**

Run: `npm run build`
Expected: PASS — confirms no server/client boundary violations in the new routes.

- [ ] **Step 4: Manual end-to-end walkthrough**

Run: `npm run dev`. Walk the golden path: `/workers` → Add worker → fill Details, save → land on detail page → Documents tab → upload passport + EID + one CICPA doc → Accommodation/Timesheets show empty states → back to `/workers`, confirm new worker listed with correct supplier/status → `/suppliers` and `/project-clients` each support add/edit/delete → delete the supplier linked to a worker, confirm the worker's detail page still loads with "Internal worker" in place of the old supplier name instead of erroring.

- [ ] **Step 5: Commit** (only if Step 4 surfaced fixes)

```bash
git add -A
git commit -m "fix: address issues found in end-to-end verification"
```
