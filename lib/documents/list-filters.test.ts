import { describe, expect, it } from "vitest";

import { normalizeListFilters, sanitizeSearchTerm } from "./list-filters";

describe("normalizeListFilters", () => {
  it("maps a type slug to a document type", () => {
    expect(normalizeListFilters({ slug: "invoices" }).type).toBe("invoice");
  });

  it("maps purchase-orders to local_purchase_order", () => {
    expect(normalizeListFilters({ slug: "purchase-orders" }).type).toBe(
      "local_purchase_order",
    );
  });

  it("returns a null type for the all-documents route", () => {
    expect(normalizeListFilters({}).type).toBeNull();
  });

  it("returns a null type for an unknown slug", () => {
    expect(normalizeListFilters({ slug: "nonsense" }).type).toBeNull();
  });

  it("falls back to the ?list= slug on a detail route", () => {
    // /documents/<uuid>?list=quotes — the segment is an id, not a type slug.
    expect(
      normalizeListFilters({
        slug: "3f0d6a1e-0000-4000-8000-000000000000",
        list: "quotes",
      }).type,
    ).toBe("quote");
  });

  it("prefers the path slug over ?list=", () => {
    expect(normalizeListFilters({ slug: "invoices", list: "quotes" }).type).toBe(
      "invoice",
    );
  });

  it("trims and lowercases the search term", () => {
    expect(normalizeListFilters({ q: "  INV-01 " }).search).toBe("inv-01");
  });

  it("treats a blank search term as absent", () => {
    expect(normalizeListFilters({ q: "   " }).search).toBeNull();
  });

  // R5: PostgREST treats commas and parentheses as its own `.or()` delimiters,
  // so an unsanitised term can rewrite the filter it is embedded in.
  it("strips PostgREST delimiters from the search term", () => {
    expect(normalizeListFilters({ q: "INV-01,status.eq.paid" }).search).toBe(
      "inv-01status.eq.paid",
    );
    expect(normalizeListFilters({ q: "acme (uk)" }).search).toBe("acme uk");
  });

  it("treats a punctuation-only search term as absent", () => {
    expect(normalizeListFilters({ q: "(),%*" }).search).toBeNull();
  });

  // R14: an ASCII allowlist mangled non-Latin names, and a term that sanitised
  // to empty counted as "no search" — i.e. it returned the FULL list. Letters
  // and digits in any script must survive.
  it("preserves accented Latin letters", () => {
    expect(normalizeListFilters({ q: "Müller" }).search).toBe("müller");
    expect(normalizeListFilters({ q: "Sœur Café" }).search).toBe("sœur café");
  });

  it("preserves non-Latin scripts", () => {
    expect(normalizeListFilters({ q: "شركة الخليج" }).search).toBe(
      "شركة الخليج",
    );
    expect(normalizeListFilters({ q: "東京デザイン" }).search).toBe(
      "東京デザイン",
    );
  });

  it("still strips PostgREST delimiters from a non-Latin term", () => {
    expect(normalizeListFilters({ q: "شركة, (الخليج)" }).search).toBe(
      "شركة الخليج",
    );
  });

  it("reads the recurring flag only for invoices", () => {
    expect(
      normalizeListFilters({ slug: "invoices", recurring: "1" }).recurringOnly,
    ).toBe(true);
    expect(
      normalizeListFilters({ slug: "quotes", recurring: "1" }).recurringOnly,
    ).toBe(false);
  });
});

describe("sanitizeSearchTerm", () => {
  it("keeps the characters document numbers are built from", () => {
    expect(sanitizeSearchTerm("INV-2026_01 #3.1")).toBe("inv-2026_01 #3.1");
  });

  it("strips every character PostgREST would parse", () => {
    expect(sanitizeSearchTerm('a,b(c)d"e\\f%g')).toBe("abcdefg");
  });

  it("collapses whitespace left behind by stripping", () => {
    expect(sanitizeSearchTerm("acme   \n  ltd")).toBe("acme ltd");
  });

  it("returns null for nullish input", () => {
    expect(sanitizeSearchTerm(undefined)).toBeNull();
    expect(sanitizeSearchTerm(null)).toBeNull();
  });
});
