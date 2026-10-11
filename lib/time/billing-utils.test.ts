import { describe, it, expect } from "vitest";
import {
  secondsToBillableHours,
  validateBillingSelection,
  buildLineItemsFromEntries,
  summarizeSelection,
  type BillableEntry,
} from "./billing-utils";

function entry(over: Partial<BillableEntry> = {}): BillableEntry {
  return {
    id: "e1",
    description: "Design work",
    durationSeconds: 3600,
    billed: false,
    project: { id: "p1", title: "Website", clientId: "c1", hourlyRate: 100 },
    ...over,
  };
}

describe("secondsToBillableHours", () => {
  it("rounds to 2dp", () => {
    expect(secondsToBillableHours(3600)).toBe(1);
    expect(secondsToBillableHours(5430)).toBe(1.51); // 1.5083 -> 1.51
    expect(secondsToBillableHours(3599)).toBe(1); // 0.9997 -> 1
    expect(secondsToBillableHours(0)).toBe(0);
    expect(secondsToBillableHours(null)).toBe(0);
  });
});

describe("validateBillingSelection", () => {
  it("rejects empty", () => {
    expect(validateBillingSelection([])).toEqual({ ok: false, error: "empty" });
  });
  it("rejects already-billed entry", () => {
    expect(validateBillingSelection([entry({ billed: true })])).toEqual({
      ok: false,
      error: "already_billed",
    });
  });
  it("rejects entry with no project/client", () => {
    expect(validateBillingSelection([entry({ project: null })])).toEqual({
      ok: false,
      error: "no_client",
    });
    expect(
      validateBillingSelection([
        entry({ project: { id: "p1", title: "X", clientId: null, hourlyRate: 100 } }),
      ]),
    ).toEqual({ ok: false, error: "no_client" });
  });
  it("rejects mixed clients", () => {
    const a = entry({ id: "a" });
    const b = entry({
      id: "b",
      project: { id: "p2", title: "Other", clientId: "c2", hourlyRate: 50 },
    });
    expect(validateBillingSelection([a, b])).toEqual({ ok: false, error: "mixed_client" });
  });
  it("accepts a valid single-client selection", () => {
    expect(validateBillingSelection([entry(), entry({ id: "e2" })])).toEqual({ ok: true });
  });
});

describe("buildLineItemsFromEntries", () => {
  it("maps entry -> line, hours as quantity, rate as unit_price", () => {
    const lines = buildLineItemsFromEntries([
      entry({ id: "e1", durationSeconds: 7200 }),
      entry({ id: "e2", description: null, durationSeconds: 1800 }),
    ]);
    expect(lines).toEqual([
      { description: "Design work", quantity: 2, unit_price: 100, tax_rate: 0, sort_order: 0 },
      { description: "Website", quantity: 0.5, unit_price: 100, tax_rate: 0, sort_order: 1 },
    ]);
  });
  it("uses 0 unit_price when project has no rate", () => {
    const lines = buildLineItemsFromEntries([
      entry({ project: { id: "p1", title: "Website", clientId: "c1", hourlyRate: null } }),
    ]);
    expect(lines[0].unit_price).toBe(0);
  });
});

describe("summarizeSelection", () => {
  it("totals hours and estimate for one client", () => {
    const s = summarizeSelection([
      entry({ id: "e1", durationSeconds: 3600 }),
      entry({ id: "e2", durationSeconds: 1800 }),
    ]);
    expect(s).toEqual({ count: 2, totalHours: 1.5, estTotal: 150, clientId: "c1", mixed: false });
  });
  it("flags mixed and null clientId", () => {
    const s = summarizeSelection([
      entry({ id: "e1" }),
      entry({ id: "e2", project: { id: "p2", title: "O", clientId: "c2", hourlyRate: 50 } }),
    ]);
    expect(s.mixed).toBe(true);
    expect(s.clientId).toBeNull();
  });
  it("returns empty summary for no entries", () => {
    expect(summarizeSelection([])).toEqual({
      count: 0,
      totalHours: 0,
      estTotal: 0,
      clientId: null,
      mixed: false,
    });
  });
});
