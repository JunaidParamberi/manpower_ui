import { describe, expect, it } from "vitest";
import { filterOptions, moveHighlight } from "./picker-filter";

const opts = [
  { label: "Acme Studio", secondary: "Sara Haddad" },
  { label: "Northwind Labs", secondary: "Tom Ellis", keywords: "GBP london" },
  { label: "Lumen Health", secondary: "Priya Nair" },
];

describe("filterOptions", () => {
  it("returns all for an empty query", () => expect(filterOptions(opts, "  ")).toHaveLength(3));
  it("matches label, secondary and keywords, case-insensitively", () => {
    expect(filterOptions(opts, "acme").map((o) => o.label)).toEqual(["Acme Studio"]);
    expect(filterOptions(opts, "priya").map((o) => o.label)).toEqual(["Lumen Health"]);
    expect(filterOptions(opts, "london").map((o) => o.label)).toEqual(["Northwind Labs"]);
  });
  it("ranks label-prefix matches first", () => {
    const list = [{ label: "Big Lumen" }, { label: "Lumen Health" }];
    expect(filterOptions(list, "lum").map((o) => o.label)).toEqual(["Lumen Health", "Big Lumen"]);
  });
});

describe("moveHighlight", () => {
  it("moves within bounds", () => {
    expect(moveHighlight(0, 3, 1)).toBe(1);
    expect(moveHighlight(2, 3, 1)).toBe(2);
    expect(moveHighlight(0, 3, -1)).toBe(0);
  });
  it("returns 0 for an empty list", () => expect(moveHighlight(0, 0, 1)).toBe(0));
});
