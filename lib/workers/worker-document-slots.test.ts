import { describe, expect, it } from "vitest";
import {
  WORKER_DOCUMENT_SLOTS,
  columnForSlot,
  isWorkerDocumentSlot,
  validateWorkerDocumentFile,
} from "./worker-document-slots";

describe("columnForSlot", () => {
  it("maps standard slots to <slot>_url", () => {
    expect(columnForSlot("passport_document")).toBe("passport_document_url");
    expect(columnForSlot("trade_license_document")).toBe("trade_license_document_url");
  });

  it("maps photo and medical insurance card overrides", () => {
    expect(columnForSlot("photo")).toBe("photo_url");
    expect(columnForSlot("medical_insurance_card")).toBe("medical_insurance_card_url");
  });

  it("every declared slot resolves to a non-empty column", () => {
    for (const slot of WORKER_DOCUMENT_SLOTS) {
      expect(columnForSlot(slot).length).toBeGreaterThan(0);
    }
  });
});

describe("isWorkerDocumentSlot", () => {
  it("returns true for every declared slot", () => {
    for (const slot of WORKER_DOCUMENT_SLOTS) {
      expect(isWorkerDocumentSlot(slot)).toBe(true);
    }
  });

  it("returns false for an arbitrary string", () => {
    expect(isWorkerDocumentSlot("status")).toBe(false);
    expect(isWorkerDocumentSlot("arbitrary_column")).toBe(false);
  });
});

describe("validateWorkerDocumentFile", () => {
  it("rejects an unsupported mime type", () => {
    const file = new File(["x"], "virus.exe", { type: "application/x-msdownload" });
    expect(validateWorkerDocumentFile(file)).toMatch(/unsupported file type/);
  });

  it("accepts a pdf", () => {
    const file = new File(["x"], "passport.pdf", { type: "application/pdf" });
    expect(validateWorkerDocumentFile(file)).toBeNull();
  });

  it("rejects an empty file", () => {
    const file = new File([], "empty.pdf", { type: "application/pdf" });
    expect(validateWorkerDocumentFile(file)).toMatch(/empty/);
  });
});
