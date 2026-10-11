import { describe, expect, it } from "vitest";

import { getDocumentReadiness, readinessMessage } from "./readiness";

const priced = [{ quantity: 1, unit_price: 10000 }];

describe("getDocumentReadiness", () => {
  it("flags a quote with no client, no priced items and no validity date", () => {
    const r = getDocumentReadiness({ type: "quote", client_id: null, valid_until: null }, []);
    expect(r.ready).toBe(false);
    expect(r.missing.map((m) => m.field)).toEqual(["client_id", "line_items", "valid_until"]);
  });

  it("accepts a complete quote", () => {
    const r = getDocumentReadiness(
      { type: "quote", client_id: "c1", valid_until: "2026-10-01" },
      priced,
    );
    expect(r).toEqual({ type: "quote", ready: true, missing: [] });
  });

  it("requires a due date on invoices", () => {
    const r = getDocumentReadiness({ type: "invoice", client_id: "c1", due_date: null }, priced);
    expect(r.missing.map((m) => m.field)).toEqual(["due_date"]);
  });

  it("does not count zero-priced or zero-quantity lines", () => {
    const r = getDocumentReadiness(
      { type: "invoice", client_id: "c1", due_date: "2026-10-01" },
      [
        { quantity: 0, unit_price: 100 },
        { quantity: 2, unit_price: "0.00" },
      ],
    );
    expect(r.missing.map((m) => m.field)).toEqual(["line_items"]);
  });

  it("parses numeric strings from Postgres", () => {
    const r = getDocumentReadiness(
      { type: "local_purchase_order", client_id: "c1" },
      [{ quantity: "1.00", unit_price: "930.00" }],
    );
    expect(r.ready).toBe(true);
  });

  it("only needs a client on proposals", () => {
    expect(getDocumentReadiness({ type: "proposal", client_id: null }, []).missing.map((m) => m.field)).toEqual([
      "client_id",
    ]);
    expect(getDocumentReadiness({ type: "proposal", client_id: "c1" }, []).ready).toBe(true);
  });

  it("has no requirements for other types", () => {
    expect(getDocumentReadiness({ type: "receipt", client_id: null }, []).ready).toBe(true);
  });
});

describe("readinessMessage", () => {
  it("joins what is missing into one sentence", () => {
    const r = getDocumentReadiness({ type: "quote", client_id: null, valid_until: null }, []);
    expect(readinessMessage(r, "send")).toBe(
      "Add a client, a line item with a price and a valid-until date before you send this quote.",
    );
  });

  it("returns null when ready", () => {
    expect(readinessMessage({ ready: true, missing: [] }, "send")).toBeNull();
  });
});
