import { describe, expect, it } from "vitest";
import type { WorkerListRow } from "@/types";
import {
  countWorkerLenses,
  matchesWorkerLens,
  nextExpiry,
  parseWorkerLens,
  uploadedRequiredCount,
  workerExpiries,
  workerGroupOf,
  workerIssues,
  workerMonogram,
} from "./worker-readiness";

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

const readyOverrides: Partial<WorkerListRow> = {
  passport_document_url: "a",
  emirates_id_document_url: "b",
  visa_document_url: "c",
  has_insurance: true,
};

describe("workerExpiries / nextExpiry", () => {
  it("returns [] for a worker with no dates", () => {
    expect(workerExpiries(makeWorker(), NOW)).toEqual([]);
    expect(nextExpiry(makeWorker(), NOW)).toBeNull();
  });

  it("sorts by daysLeft ascending", () => {
    const w = makeWorker({ visa_expiry: "2026-11-08", passport_expiry: "2026-10-14" });
    expect(workerExpiries(w, NOW)).toEqual([
      { kind: "passport", label: "Passport", date: "2026-10-14", daysLeft: -4 },
      { kind: "visa", label: "Visa", date: "2026-11-08", daysLeft: 21 },
    ]);
    expect(nextExpiry(w, NOW)?.kind).toBe("passport");
  });
});

describe("uploadedRequiredCount", () => {
  it("ignores optional slots", () => {
    const w = makeWorker({
      passport_document_url: "x",
      passport_document_optional_url: "y",
      photo_url: "z",
    });
    expect(uploadedRequiredCount(w)).toBe(2);
  });
});

describe("workerIssues", () => {
  it("flags missing ids and insurance on an empty worker", () => {
    expect(workerIssues(makeWorker(), NOW)).toEqual([
      {
        id: "missing-ids",
        title: "Missing passport, Emirates ID, visa",
        detail: "Needed for site access and the labour card.",
        tone: "warning",
      },
      {
        id: "no-insurance",
        title: "No medical insurance",
        detail: "Add an insurance card on the Documents tab.",
        tone: "warning",
      },
    ]);
  });

  it("treats today as expiring, not expired", () => {
    const issues = workerIssues(makeWorker({ ...readyOverrides, emirates_id_expiry: "2026-10-18" }), NOW);
    expect(issues).toContainEqual({
      id: "expiring-emirates_id",
      title: "Emirates ID expires today",
      detail: "Start the renewal now so the worker stays deployable.",
      tone: "warning",
    });
    expect(issues.some((i) => i.id.startsWith("expired-"))).toBe(false);
  });

  it("flags expired first with danger tone", () => {
    const issues = workerIssues(makeWorker({ passport_expiry: "2026-10-17" }), NOW);
    expect(issues[0]).toEqual({
      id: "expired-passport",
      title: "Passport expired",
      detail: "Expired 1 day ago. Renew it before the next site visit.",
      tone: "danger",
    });
  });

  it("pluralises days and titles expiring-in", () => {
    const issues = workerIssues(
      makeWorker({ ...readyOverrides, passport_expiry: "2026-10-10", visa_expiry: "2026-11-17" }),
      NOW,
    );
    expect(issues[0].detail).toBe("Expired 8 days ago. Renew it before the next site visit.");
    expect(issues[1].title).toBe("Visa expires in 30 days");
  });

  it("returns [] when everything is in order", () => {
    expect(workerIssues(makeWorker(readyOverrides), NOW)).toEqual([]);
  });

  it("treats an uploaded insurance card as insured", () => {
    const w = makeWorker({
      ...readyOverrides,
      has_insurance: false,
      medical_insurance_card_url: "https://x/card.pdf",
    });
    expect(workerIssues(w, NOW)).toEqual([]);
    expect(workerIssues(makeWorker({ ...readyOverrides, has_insurance: false }), NOW)).toContainEqual({
      id: "no-insurance",
      title: "No medical insurance",
      detail: "Add an insurance card on the Documents tab.",
      tone: "warning",
    });
  });
});

describe("groups and lenses", () => {
  const ready = makeWorker({ ...readyOverrides });
  const needs = makeWorker({ status: "deployed" });
  const inactive = makeWorker({ status: "inactive" });

  it("workerGroupOf", () => {
    expect(workerGroupOf(inactive, NOW)).toBe("inactive");
    expect(workerGroupOf(makeWorker(), NOW)).toBe("needs-you");
    expect(workerGroupOf(ready, NOW)).toBe("ready");
  });

  it("matchesWorkerLens", () => {
    expect(matchesWorkerLens(needs, "deployed", NOW)).toBe(true);
    expect(matchesWorkerLens(ready, "deployed", NOW)).toBe(false);
    expect(matchesWorkerLens(inactive, "all", NOW)).toBe(true);
    expect(matchesWorkerLens(ready, "ready", NOW)).toBe(true);
    expect(matchesWorkerLens(needs, "needs-you", NOW)).toBe(true);
  });

  it("countWorkerLenses", () => {
    expect(countWorkerLenses([ready, needs, inactive], NOW)).toEqual({
      all: 3,
      "needs-you": 1,
      ready: 1,
      deployed: 1,
    });
  });

  it("parseWorkerLens", () => {
    expect(parseWorkerLens("needs-you")).toBe("needs-you");
    expect(parseWorkerLens("bogus")).toBe("all");
    expect(parseWorkerLens(null)).toBe("all");
  });
});

describe("workerMonogram", () => {
  it("handles names", () => {
    expect(workerMonogram("Ibrahim Yusuf")).toBe("IY");
    expect(workerMonogram("  Ali  ")).toBe("A");
    expect(workerMonogram("Juan Dela Cruz")).toBe("JC");
    expect(workerMonogram("")).toBe("?");
  });
});
