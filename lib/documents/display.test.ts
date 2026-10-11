import { describe, expect, it } from "vitest";
import {
  documentStatusLabel,
  documentStatusVariant,
  documentTypeLabel,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_VARIANTS,
  DOCUMENT_TYPE_LABELS,
  formatDocumentAmount,
  getDocumentDueDateCountdown,
  getDocumentListNumber,
  INVOICE_MANUAL_STATUSES,
  isDocumentOverdue,
  isManualInvoiceStatus,
} from "@/lib/documents/display";
import type { DocumentStatus, DocumentType } from "@/types";

describe("documentTypeLabel", () => {
  it("returns correct label for each document type", () => {
    const cases: [DocumentType, string][] = [
      ["proposal", "Proposal"],
      ["quote", "Quote"],
      ["invoice", "Invoice"],
      ["other", "Document"],
    ];
    for (const [type, expected] of cases) {
      expect(documentTypeLabel(type)).toBe(expected);
    }
  });

  it("DOCUMENT_TYPE_LABELS covers all types", () => {
    const types: DocumentType[] = ["proposal", "quote", "invoice", "other"];
    for (const t of types) {
      expect(DOCUMENT_TYPE_LABELS[t]).toBeDefined();
    }
  });
});

describe("documentStatusLabel", () => {
  it("returns correct label for each status", () => {
    const cases: [DocumentStatus, string][] = [
      ["draft", "Draft"],
      ["sent", "Sent"],
      ["viewed", "Viewed"],
      ["signed", "Signed"],
      ["paid", "Paid"],
      ["partially_paid" as DocumentStatus, "Partially Paid"],
      ["written_off" as DocumentStatus, "Written Off"],
      ["archived", "Archived"],
      ["approved", "Approved"],
      ["declined", "Declined"],
    ];
    for (const [status, expected] of cases) {
      expect(documentStatusLabel(status)).toBe(expected);
    }
  });

  it("DOCUMENT_STATUS_LABELS has entry for partial and written-off states", () => {
    expect(DOCUMENT_STATUS_LABELS["partially_paid" as DocumentStatus]).toBe("Partially Paid");
    expect(DOCUMENT_STATUS_LABELS["written_off" as DocumentStatus]).toBe("Written Off");
  });

  it("DOCUMENT_STATUS_LABELS has entry for approved and declined", () => {
    expect(DOCUMENT_STATUS_LABELS["approved"]).toBe("Approved");
    expect(DOCUMENT_STATUS_LABELS["declined"]).toBe("Declined");
  });
});

describe("documentStatusVariant", () => {
  it("approved maps to default variant", () => {
    expect(documentStatusVariant("approved")).toBe("default");
  });

  it("declined maps to destructive variant", () => {
    expect(documentStatusVariant("declined")).toBe("destructive");
  });

  it("draft maps to outline variant", () => {
    expect(documentStatusVariant("draft")).toBe("outline");
  });

  it("paid maps to default variant", () => {
    expect(documentStatusVariant("paid")).toBe("default");
  });

  it("partially paid maps to secondary variant", () => {
    expect(documentStatusVariant("partially_paid" as DocumentStatus)).toBe("secondary");
  });

  it("written off maps to outline variant", () => {
    expect(documentStatusVariant("written_off" as DocumentStatus)).toBe("outline");
  });

  it("DOCUMENT_STATUS_VARIANTS covers all statuses", () => {
    const statuses: DocumentStatus[] = [
      "draft",
      "sent",
      "viewed",
      "signed",
      "paid",
      "partially_paid" as DocumentStatus,
      "written_off" as DocumentStatus,
      "archived",
      "approved",
      "declined",
    ];
    for (const s of statuses) {
      expect(DOCUMENT_STATUS_VARIANTS[s]).toBeDefined();
    }
  });
});

describe("isManualInvoiceStatus", () => {
  it("allows only non-settlement invoice statuses", () => {
    expect(INVOICE_MANUAL_STATUSES).toEqual([
      "draft",
      "sent",
      "viewed",
      "archived",
    ]);
  });

  it("rejects payment-derived settlement statuses", () => {
    for (const status of ["paid", "partially_paid", "written_off"] as const) {
      expect(isManualInvoiceStatus(status)).toBe(false);
    }
  });
});

describe("formatDocumentAmount", () => {
  it("formats currency amounts", () => {
    expect(formatDocumentAmount(1234.5, "USD")).toBe("$1,234.50");
  });

  it("returns em dash for null", () => {
    expect(formatDocumentAmount(null, "USD")).toBe("—");
  });
});

describe("isDocumentOverdue", () => {
  const now = new Date("2026-06-15T12:00:00Z");

  it("returns true when due date is before today and status is open", () => {
    expect(
      isDocumentOverdue({
        status: "sent",
        dueDate: "2026-06-10",
        now,
      }),
    ).toBe(true);
  });

  it("returns false for paid invoices", () => {
    expect(
      isDocumentOverdue({
        status: "paid",
        dueDate: "2026-06-10",
        now,
      }),
    ).toBe(false);
  });
});

describe("getDocumentDueDateCountdown", () => {
  const now = new Date("2026-06-15T12:00:00Z");

  it("returns overdue label", () => {
    expect(getDocumentDueDateCountdown("2026-06-10", "sent", now)?.label).toBe(
      "5d overdue",
    );
  });
});

describe("getDocumentListNumber", () => {
  it("prefers typed number over title", () => {
    expect(
      getDocumentListNumber({
        title: "My invoice",
        invoice_number: "INV-0042",
      }),
    ).toBe("INV-0042");
  });
});
