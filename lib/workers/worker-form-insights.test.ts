import { describe, expect, it } from "vitest";

import type { WorkerInput } from "@/lib/validations/worker";
import type { SupplierRow } from "@/types";
import { buildWorkerFormInsights, expiryNote } from "./worker-form-insights";

const NOW = "2026-10-18T09:00:00.000Z";

function workerValues(overrides: Partial<WorkerInput> = {}): WorkerInput {
  return {
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
    ...overrides,
  };
}

const suppliers: SupplierRow[] = [
  { id: "s1", name: "Jubily Power Technical Services" },
] as SupplierRow[];

describe("buildWorkerFormInsights", () => {
  it("summarizes an empty draft", () => {
    const insights = buildWorkerFormInsights(workerValues(), NOW);
    expect(insights.monogram).toBe("?");
    expect(insights.displayName).toBe("Unnamed worker");
    expect(insights.statusLabel).toBe("Available");
    expect(insights.metaLabel).toBe("");
    expect(insights.supplierLabel).toBe("");
    expect(insights.clientsCount).toBe(0);
    expect(insights.nextExpiryLabel).toBeNull();
    expect(insights.completedCount).toBe(1); // only status
    expect(insights.totalCount).toBe(5);
    expect(insights.completionPercent).toBe(20);
    expect(insights.missingEssentials).toEqual([
      "Add an employee ID",
      "Add a name",
      "Add passport, Emirates ID and visa numbers",
      "Add passport, Emirates ID and visa expiry dates",
    ]);
  });

  it("builds the header-style meta from identity fields and resolves the supplier", () => {
    const insights = buildWorkerFormInsights(
      workerValues({
        employee_id: "EMP/2026/0002",
        name: "Ibrahim Yusuf",
        trade_category: "Mason",
        nationality: "Ghana",
        supplier_id: "s1",
        client_ids: ["c1", "c2"],
      }),
      NOW,
      suppliers,
    );
    expect(insights.monogram).toBe("IY");
    expect(insights.displayName).toBe("Ibrahim Yusuf");
    expect(insights.metaLabel).toBe("EMP/2026/0002 · Mason · Ghana");
    expect(insights.supplierLabel).toBe("Jubily Power Technical Services");
    expect(insights.clientsCount).toBe(2);
  });

  it("picks the nearest expiry, expired first", () => {
    const insights = buildWorkerFormInsights(
      workerValues({
        passport_expiry: "2026-10-14",
        visa_expiry: "2026-11-08",
      }),
      NOW,
    );
    expect(insights.nextExpiryLabel).toBe("Passport · expired 4d ago");
  });

  it("treats today as expiring today", () => {
    const insights = buildWorkerFormInsights(
      workerValues({ emirates_id_expiry: "2026-10-18" }),
      NOW,
    );
    expect(insights.nextExpiryLabel).toBe("Emirates ID · expires today");
  });

  it("formats a future expiry as in N d", () => {
    const insights = buildWorkerFormInsights(
      workerValues({ visa_expiry: "2026-11-08" }),
      NOW,
    );
    expect(insights.nextExpiryLabel).toBe("Visa · in 21d");
  });

  it("completes when identity, numbers and expiries are all on file", () => {
    const insights = buildWorkerFormInsights(
      workerValues({
        employee_id: "EMP/2026/0002",
        name: "Ibrahim Yusuf",
        passport_number: "A123",
        emirates_id: "784-1",
        visa_number: "V99",
        passport_expiry: "2027-01-01",
        emirates_id_expiry: "2027-02-01",
        visa_expiry: "2027-03-01",
      }),
      NOW,
    );
    expect(insights.completedCount).toBe(5);
    expect(insights.completionPercent).toBe(100);
    expect(insights.missingEssentials).toEqual([]);
  });
});

describe("steps", () => {
  it("starts with no steps complete", () => {
    const insights = buildWorkerFormInsights(workerValues(), NOW);
    expect(insights.steps).toEqual({
      identity: false,
      work: false,
      documents: false,
    });
    expect(insights.completedSteps).toBe(0);
    expect(insights.totalSteps).toBe(3);
  });

  it("ticks identity for employee id + name and work for a placement", () => {
    const identityOnly = buildWorkerFormInsights(
      workerValues({ employee_id: "EMP/2026/0002", name: "Ibrahim Yusuf" }),
      NOW,
    );
    expect(identityOnly.steps.identity).toBe(true);
    expect(identityOnly.steps.work).toBe(false);
    expect(identityOnly.completedSteps).toBe(1);

    const withSupplier = buildWorkerFormInsights(
      workerValues({
        employee_id: "EMP/2026/0002",
        name: "Ibrahim Yusuf",
        supplier_id: "s1",
      }),
      NOW,
      suppliers,
    );
    expect(withSupplier.steps.work).toBe(true);

    const withClient = buildWorkerFormInsights(
      workerValues({
        employee_id: "EMP/2026/0002",
        name: "Ibrahim Yusuf",
        client_ids: ["c1"],
      }),
      NOW,
    );
    expect(withClient.steps.work).toBe(true);
  });

  it("ticks documents when all three numbers and expiries are on file", () => {
    const insights = buildWorkerFormInsights(
      workerValues({
        employee_id: "EMP/2026/0002",
        name: "Ibrahim Yusuf",
        supplier_id: "s1",
        passport_number: "A123",
        emirates_id: "784-1",
        visa_number: "V99",
        passport_expiry: "2027-01-01",
        emirates_id_expiry: "2027-02-01",
        visa_expiry: "2027-03-01",
      }),
      NOW,
      suppliers,
    );
    expect(insights.steps).toEqual({
      identity: true,
      work: true,
      documents: true,
    });
    expect(insights.completedSteps).toBe(3);
  });
});

describe("jump targets", () => {
  it("points each missing item at its first incomplete field", () => {
    const insights = buildWorkerFormInsights(
      workerValues({
        emirates_id: "784-1",
        visa_number: "V99",
        emirates_id_expiry: "2027-02-01",
      }),
      NOW,
    );
    const targets = Object.fromEntries(
      insights.completionItems
        .filter((item) => !item.complete)
        .map((item) => [item.id, item.jumpTarget]),
    );
    expect(targets).toEqual({
      employee_id: "worker-employee-id",
      name: "worker-name",
      id_details: "worker-passport-number",
      expiries: "worker-passport-expiry",
    });
  });
});

describe("expiryNote", () => {
  it("classifies dates relative to now", () => {
    expect(expiryNote("", NOW)).toBeNull();
    expect(expiryNote("2026-10-14", NOW)).toEqual({
      label: "expired",
      tone: "danger",
    });
    expect(expiryNote("2026-10-20", NOW)).toEqual({
      label: "due soon",
      tone: "warning",
    });
    expect(expiryNote("2027-01-16", NOW)).toEqual({
      label: "valid",
      tone: "muted",
    });
  });
});
