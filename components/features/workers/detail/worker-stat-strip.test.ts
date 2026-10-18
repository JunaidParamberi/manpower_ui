import { describe, expect, it } from "vitest";
import type { WorkerListRow } from "@/types";
import { REQUIRED_DOCUMENT_SLOTS } from "@/lib/workers/worker-readiness";
import { columnForSlot } from "@/lib/workers/worker-document-slots";
import { buildWorkerStatCells } from "./worker-stat-strip";

const NOW = "2026-10-18T09:00:00.000Z";

function makeWorker(overrides: Partial<WorkerListRow> = {}): WorkerListRow {
  return {
    id: "w1",
    user_id: "u1",
    employee_id: "EMP/2026/0002",
    name: "Ibrahim Yusuf",
    nationality: null,
    trade_category: null,
    status: "available",
    supplier_id: null,
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
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-01T00:00:00.000Z",
    supplier: null,
    clients: [],
    ...overrides,
  };
}


function isoOffset(days: number): string {
  const d = new Date(Date.parse("2026-10-18T00:00:00.000Z") + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

describe("buildWorkerStatCells", () => {
  it("handles an empty worker", () => {
    expect(buildWorkerStatCells(makeWorker(), NOW)).toEqual([
      { label: "Documents", value: "0 / 9", sub: "9 missing", tone: "warning" },
      { label: "Next expiry", value: "\u2014", sub: "no expiry dates entered" },
      { label: "Clients", value: "0 linked", sub: "not assigned" },
      { label: "Medical", value: "Not fit", sub: "no insurance", tone: "warning" },
    ]);
  });

  it("flags an expired document as danger", () => {
    const cells = buildWorkerStatCells(makeWorker({ passport_expiry: isoOffset(-4) }), NOW);
    expect(cells[1]).toEqual({
      label: "Next expiry",
      value: "Passport",
      sub: "expired 4 days ago",
      tone: "danger",
    });
  });

  it("warns when an expiry is within 30 days", () => {
    const cells = buildWorkerStatCells(makeWorker({ visa_expiry: isoOffset(21) }), NOW);
    expect(cells[1]).toEqual({ label: "Next expiry", value: "21 days", sub: "Visa", tone: "warning" });
  });

  it("has no tone for a distant expiry", () => {
    const cells = buildWorkerStatCells(makeWorker({ visa_expiry: isoOffset(200) }), NOW);
    expect(cells[1]).toEqual({ label: "Next expiry", value: "200 days", sub: "Visa" });
  });

  it("shows all documents on file", () => {
    const overrides: Record<string, string> = {};
    for (const slot of REQUIRED_DOCUMENT_SLOTS) overrides[columnForSlot(slot)] = "https://x/y.pdf";
    const cells = buildWorkerStatCells(makeWorker(overrides as Partial<WorkerListRow>), NOW);
    expect(cells[0]).toEqual({ label: "Documents", value: "9 / 9", sub: "all on file" });
  });

  it("shows a linked client, fit and insured", () => {
    const cells = buildWorkerStatCells(
      makeWorker({ clients: [{ id: "c1", name: "Acme" }], medical_fit: true, has_insurance: true }),
      NOW,
    );
    expect(cells[2]).toEqual({ label: "Clients", value: "1 linked", sub: "on site" });
    expect(cells[3]).toEqual({ label: "Medical", value: "Fit", sub: "insured" });
  });

  it("counts an uploaded insurance card as insured, with no warning tone", () => {
    const cells = buildWorkerStatCells(makeWorker({ medical_insurance_card_url: "https://x/card.pdf" }), NOW);
    expect(cells[3]).toEqual({ label: "Medical", value: "Not fit", sub: "insured" });
  });

  it("warns on Medical when uninsured, regardless of medical_fit", () => {
    const cells = buildWorkerStatCells(makeWorker({ medical_fit: true }), NOW);
    expect(cells[3]).toEqual({ label: "Medical", value: "Fit", sub: "no insurance", tone: "warning" });
  });
});
