import { describe, expect, it } from "vitest";

import {
  buildClientHref,
  buildDocumentHref,
  buildProjectHref,
  formatClientSearchResult,
  formatDocumentSearchResult,
  formatProjectSearchResult,
  getDocumentDisplayNumber,
  rankSearchResults,
  sanitizeIlikePattern,
} from "./format-result";
import type { GlobalSearchClientResult } from "./types";

describe("sanitizeIlikePattern", () => {
  it("strips wildcard and filter-breaking characters", () => {
    expect(sanitizeIlikePattern("acme%_\\,")).toBe("acme");
  });
});

describe("href builders", () => {
  it("builds entity routes", () => {
    expect(buildClientHref("c1")).toBe("/clients/c1");
    expect(buildProjectHref("p1")).toBe("/projects?project=p1");
    expect(buildDocumentHref("d1")).toBe("/documents/d1");
  });
});

describe("getDocumentDisplayNumber", () => {
  it("prefers typed numbers over title", () => {
    expect(
      getDocumentDisplayNumber({
        title: "Draft invoice",
        invoice_number: "INV-0042",
        quote_number: "QUO-0001",
      }),
    ).toBe("INV-0042");
  });

  it("falls back to title when no number exists", () => {
    expect(getDocumentDisplayNumber({ title: "Untitled proposal" })).toBe(
      "Untitled proposal",
    );
  });
});

describe("formatClientSearchResult", () => {
  it("uses company as subtitle when present", () => {
    expect(
      formatClientSearchResult({
        id: "c1",
        name: "Acme Corp",
        company: "Acme LLC",
        email: "hello@acme.test",
      }),
    ).toEqual({
      kind: "client",
      id: "c1",
      label: "Acme Corp",
      subtitle: "Acme LLC",
      href: "/clients/c1",
    });
  });
});

describe("formatProjectSearchResult", () => {
  it("includes client name and status in subtitle", () => {
    const result = formatProjectSearchResult({
      id: "p1",
      title: "Website redesign",
      status: "active",
      client: { name: "Acme Corp" },
    });
    expect(result.label).toBe("Website redesign");
    expect(result.subtitle).toContain("Acme Corp");
    expect(result.subtitle).toContain("In progress");
  });
});

describe("formatDocumentSearchResult", () => {
  it("maps invoice metadata", () => {
    const result = formatDocumentSearchResult({
      id: "d1",
      type: "invoice",
      status: "sent",
      title: "Invoice",
      invoice_number: "INV-0007",
      client: { name: "Acme Corp" },
    });
    expect(result.label).toBe("INV-0007");
    expect(result.typeBadge).toBe("INV");
    expect(result.statusLabel).toBe("Sent");
    expect(result.subtitle).toContain("Invoice");
    expect(result.subtitle).toContain("Acme Corp");
  });
});

describe("rankSearchResults", () => {
  const rows: GlobalSearchClientResult[] = [
    {
      kind: "client",
      id: "1",
      label: "Beta Studio",
      subtitle: "",
      href: "/clients/1",
    },
    {
      kind: "client",
      id: "2",
      label: "Acme Corp",
      subtitle: "",
      href: "/clients/2",
    },
    {
      kind: "client",
      id: "3",
      label: "Acme Partners",
      subtitle: "",
      href: "/clients/3",
    },
  ];

  it("ranks exact matches first, then prefix, then contains", () => {
    const ranked = rankSearchResults(rows, "acme");
    expect(ranked.map((r) => r.id)).toEqual(["2", "3", "1"]);
  });
});
