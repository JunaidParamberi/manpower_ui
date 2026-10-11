import { describe, expect, it } from "vitest";

import {
  appendReceiptUrls,
  normalizeReceiptUrls,
  removeReceiptUrl,
} from "@/lib/expenses/receipt-utils";

describe("normalizeReceiptUrls", () => {
  it("parses jsonb array", () => {
    expect(
      normalizeReceiptUrls(
        ["https://a.example/1.pdf", "https://a.example/2.png"],
        null,
      ),
    ).toEqual(["https://a.example/1.pdf", "https://a.example/2.png"]);
  });

  it("falls back to legacy receipt_url", () => {
    expect(normalizeReceiptUrls([], "https://legacy.example/r.pdf")).toEqual([
      "https://legacy.example/r.pdf",
    ]);
  });
});

describe("appendReceiptUrls", () => {
  it("dedupes and caps", () => {
    const result = appendReceiptUrls(
      ["https://a.example/1.pdf"],
      ["https://a.example/1.pdf", "https://a.example/2.pdf"],
    );
    expect(result).toHaveLength(2);
  });
});

describe("removeReceiptUrl", () => {
  it("removes one url", () => {
    expect(
      removeReceiptUrl(
        ["https://a.example/1.pdf", "https://a.example/2.pdf"],
        "https://a.example/1.pdf",
      ),
    ).toEqual(["https://a.example/2.pdf"]);
  });
});
