import { describe, expect, it } from "vitest";
import type { LineItemRow } from "@/types";
import {
  fromRows, insertAfter, lineAmount, moveLine, newLine, removeLine, stepField, toUpsertPayload,
} from "./line-items-keyboard";

const a = newLine("a", { description: "Brand identity", quantity: 1, unit_price: 6500 });
const b = newLine("b", { description: "UI design", quantity: 18, unit_price: 350 });
const c = newLine("c", { description: "QA" });

describe("insertAfter", () => {
  it("inserts below the given line", () => {
    expect(insertAfter([a, b], "a", c).map((l) => l.key)).toEqual(["a", "c", "b"]);
  });
  it("appends when afterKey is null", () => {
    expect(insertAfter([a, b], null, c).map((l) => l.key)).toEqual(["a", "b", "c"]);
  });
  it("appends when afterKey is unknown", () => {
    expect(insertAfter([a], "zzz", c).map((l) => l.key)).toEqual(["a", "c"]);
  });
});

describe("removeLine", () => {
  it("removes and focuses the previous line", () => {
    expect(removeLine([a, b, c], "b")).toEqual({ lines: [a, c], focusKey: "a" });
  });
  it("focuses the next line when removing the first", () => {
    expect(removeLine([a, b], "a")).toEqual({ lines: [b], focusKey: "b" });
  });
  it("returns null focus when the list empties", () => {
    expect(removeLine([a], "a")).toEqual({ lines: [], focusKey: null });
  });
});

describe("stepField", () => {
  it("steps quantity by 1", () => {
    expect(stepField([b], "b", "quantity", 1, false)[0].quantity).toBe(19);
  });
  it("steps rate by 50, ×10 with shift", () => {
    expect(stepField([b], "b", "unit_price", 1, true)[0].unit_price).toBe(850);
  });
  it("keeps quantity at one or more, since the server rejects zero", () => {
    expect(stepField([a], "a", "quantity", -1, true)[0].quantity).toBe(1);
    expect(stepField([b], "b", "quantity", -1, false)[0].quantity).toBe(17);
  });
  it("lets the rate reach zero but not below", () => {
    const cheap = newLine("z", { unit_price: 30 });
    expect(stepField([cheap], "z", "unit_price", -1, false)[0].unit_price).toBe(0);
  });
  it("leaves other lines alone", () => {
    const out = stepField([a, b], "b", "quantity", 1, false);
    expect(out[0]).toBe(a);
  });
});

describe("moveLine", () => {
  it("moves a line onto another's position", () => {
    expect(moveLine([a, b, c], "c", "a").map((l) => l.key)).toEqual(["c", "a", "b"]);
  });
  it("is a no-op for the same key", () => {
    expect(moveLine([a, b], "a", "a").map((l) => l.key)).toEqual(["a", "b"]);
  });
});

describe("row conversion", () => {
  it("maps rows in sort order and back to payloads", () => {
    const rows = [
      { id: "r2", document_id: "d", description: "Two", notes: null, quantity: 2, unit_price: 10, tax_rate: 0, sort_order: 1, hsn_sac_code: null, created_at: "", updated_at: "" },
      { id: "r1", document_id: "d", description: "One", notes: "n", quantity: 1, unit_price: 5, tax_rate: 5, sort_order: 0, hsn_sac_code: "9983", created_at: "", updated_at: "" },
    ] satisfies LineItemRow[];
    const lines = fromRows(rows);
    expect(lines.map((l) => l.id)).toEqual(["r1", "r2"]);
    expect(toUpsertPayload(lines[0], 0)).toEqual({ id: "r1", description: "One", notes: "n", quantity: 1, unit_price: 5, tax_rate: 5, sort_order: 0, hsn_sac_code: "9983" });
    expect(toUpsertPayload(newLine("x", { description: "New" }), 3)).toEqual({ description: "New", notes: null, quantity: 1, unit_price: 0, tax_rate: 0, sort_order: 3, hsn_sac_code: null });
  });
  it("computes the amount", () => expect(lineAmount(b)).toBe(6300));
});
