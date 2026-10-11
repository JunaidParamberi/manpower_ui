import { describe, expect, it } from "vitest";

import {
  deriveActiveType,
  deriveActiveTypeFromPathname,
  documentDetailHref,
  documentIdFromPathname,
  isTypeSlug,
  slugFromType,
  typeFromSlug,
} from "@/lib/documents/document-routes";
import type { DocumentType } from "@/types";

const docs: { id: string; type: DocumentType }[] = [
  { id: "11111111-1111-1111-1111-111111111111", type: "invoice" },
  { id: "22222222-2222-2222-2222-222222222222", type: "receipt" },
];

describe("typeFromSlug", () => {
  it("maps known slugs to types", () => {
    expect(typeFromSlug("invoices")).toBe("invoice");
    expect(typeFromSlug("purchase-orders")).toBe("local_purchase_order");
  });
  it("returns null for unknown slug", () => {
    expect(typeFromSlug("banana")).toBeNull();
    expect(typeFromSlug("11111111-1111-1111-1111-111111111111")).toBeNull();
  });
});

describe("slugFromType", () => {
  it("round-trips every routed type", () => {
    for (const type of ["invoice", "quote", "proposal", "local_purchase_order", "receipt"] as const) {
      const slug = slugFromType(type);
      expect(slug).not.toBeNull();
      expect(typeFromSlug(slug as string)).toBe(type);
    }
  });
  it("returns null for unrouted types", () => {
    expect(slugFromType("statement")).toBeNull();
    expect(slugFromType("other")).toBeNull();
  });
});

describe("isTypeSlug", () => {
  it("is true for known slugs, false otherwise", () => {
    expect(isTypeSlug("quotes")).toBe(true);
    expect(isTypeSlug("nope")).toBe(false);
  });
});

describe("deriveActiveTypeFromPathname", () => {
  it("returns the type for a type route", () => {
    expect(deriveActiveTypeFromPathname("/documents/invoices")).toBe("invoice");
    expect(deriveActiveTypeFromPathname("/documents/quotes")).toBe("quote");
  });

  it("returns null for all-documents routes and bare detail ids", () => {
    expect(deriveActiveTypeFromPathname("/documents")).toBeNull();
    expect(deriveActiveTypeFromPathname("/documents/22222222-2222-2222-2222-222222222222")).toBeNull();
  });

  it("reads list filter from query slug on detail routes", () => {
    expect(
      deriveActiveTypeFromPathname(
        "/documents/22222222-2222-2222-2222-222222222222",
        "quotes",
      ),
    ).toBe("quote");
  });
});

describe("documentDetailHref", () => {
  it("omits query when viewing all documents", () => {
    expect(documentDetailHref("abc", null)).toBe("/documents/abc");
  });

  it("preserves type tab in list query", () => {
    expect(documentDetailHref("abc", "quote")).toBe("/documents/abc?list=quotes");
  });
});

describe("documentIdFromPathname", () => {
  it("returns the id for a bare document route", () => {
    expect(
      documentIdFromPathname(
        "/documents/22222222-2222-2222-2222-222222222222",
      ),
    ).toBe("22222222-2222-2222-2222-222222222222");
  });

  it("returns the id for a document edit route", () => {
    expect(
      documentIdFromPathname(
        "/documents/22222222-2222-2222-2222-222222222222/edit",
      ),
    ).toBe("22222222-2222-2222-2222-222222222222");
  });

  it("returns null for the documents index", () => {
    expect(documentIdFromPathname("/documents")).toBeNull();
  });

  it("returns null for every type slug route", () => {
    expect(documentIdFromPathname("/documents/invoices")).toBeNull();
    expect(documentIdFromPathname("/documents/quotes")).toBeNull();
    expect(documentIdFromPathname("/documents/proposals")).toBeNull();
    expect(documentIdFromPathname("/documents/purchase-orders")).toBeNull();
    expect(documentIdFromPathname("/documents/receipts")).toBeNull();
  });

  it("returns null for the new-document route", () => {
    expect(documentIdFromPathname("/documents/new")).toBeNull();
  });

  it("returns null for a non-uuid segment", () => {
    expect(documentIdFromPathname("/documents/not-a-uuid")).toBeNull();
  });
});

describe("deriveActiveType (segment slug only)", () => {
  it("returns the type for a type-slug segment", () => {
    expect(deriveActiveType(["invoices"], docs)).toBe("invoice");
  });
  it("does not infer type from document uuid segments", () => {
    expect(deriveActiveType(["22222222-2222-2222-2222-222222222222"], docs)).toBeNull();
  });
  it("returns null for no segment", () => {
    expect(deriveActiveType([], docs)).toBeNull();
  });
});
