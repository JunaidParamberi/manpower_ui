import { describe, it, expect } from "vitest";
import { formatDocumentNumber } from "./document-numbers";

describe("formatDocumentNumber", () => {
  it("formats invoice number", () => {
    expect(formatDocumentNumber("invoice", 1)).toBe("INV-0001");
    expect(formatDocumentNumber("invoice", 42)).toBe("INV-0042");
    expect(formatDocumentNumber("invoice", 9999)).toBe("INV-9999");
    expect(formatDocumentNumber("invoice", 10000)).toBe("INV-10000");
  });

  it("formats quote number", () => {
    expect(formatDocumentNumber("quote", 3)).toBe("QUO-0003");
  });

  it("formats receipt number", () => {
    expect(formatDocumentNumber("receipt", 1)).toBe("RCT-0001");
  });

  it("formats proposal number", () => {
    expect(formatDocumentNumber("proposal", 7)).toBe("PRO-0007");
  });

  it("formats unknown type with DOC prefix", () => {
    expect(formatDocumentNumber("other", 1)).toBe("DOC-0001");
  });
});
