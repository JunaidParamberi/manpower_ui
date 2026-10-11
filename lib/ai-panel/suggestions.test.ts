import { describe, expect, it } from "vitest";

import { suggestionsForPath } from "./suggestions";

describe("suggestionsForPath", () => {
  it.each([
    ["/dashboard", "Dashboard"],
    ["/clients", "Clients"],
    ["/clients/new", "Clients"],
    ["/clients/7b1d6f8e-2b4c-4a51-9b0e-4d7c1a2f3e4d", "this client"],
    ["/clients/7b1d6f8e/edit", "this client"],
    ["/projects", "Projects"],
    ["/projects/templates", "Projects"],
    ["/projects/abc123", "this project"],
    ["/documents", "Documents"],
    ["/documents/invoices", "Invoices"],
    ["/documents/quotes", "Quotes"],
    ["/documents/proposals", "Proposals"],
    ["/documents/purchase-orders", "Purchase orders"],
    ["/documents/receipts", "Receipts"],
    ["/documents/new", "Documents"],
    ["/documents/abc123", "this document"],
    ["/documents/abc123/edit", "this document"],
    ["/marketing", "Marketing"],
    ["/finance", "Finance"],
    ["/finance/recurring", "Finance"],
    ["/expenses", "Finance"],
    ["/tasks", "Tasks"],
    ["/time", "Time"],
  ])("labels %s as %s", (path, label) => {
    expect(suggestionsForPath(path).pageLabel).toBe(label);
  });

  it("falls back to a sensible default", () => {
    const fallback = suggestionsForPath("/settings/billing");
    expect(fallback.pageLabel).toBe("Manpower");
    expect(fallback.items).toHaveLength(3);
  });

  it("ignores a query string", () => {
    expect(suggestionsForPath("/documents/invoices?status=overdue").pageLabel).toBe("Invoices");
  });

  it("always offers three prompts with at least one of each mode", () => {
    for (const path of ["/", "/dashboard", "/clients", "/clients/x", "/projects/x", "/documents/quotes", "/marketing", "/time"]) {
      const { items } = suggestionsForPath(path);
      expect(items).toHaveLength(3);
      expect(items.some((item) => item.mode === "ask")).toBe(true);
      expect(items.some((item) => item.mode === "agent")).toBe(true);
    }
  });
});
