import { describe, expect, it } from "vitest";

import {
  bundleToCsvFiles,
  rowsToCsv,
  summarizeBundle,
  type UserExportBundle,
} from "@/lib/account/export-data";
import {
  DELETE_ACCOUNT_CONFIRMATION,
  changeEmailSchema,
  changePasswordSchema,
  deleteAccountSchema,
  isExportFormat,
} from "@/lib/validations/account";

describe("rowsToCsv", () => {
  it("escapes commas and quotes", () => {
    const csv = rowsToCsv([
      { id: "1", name: 'Acme, "LLC"', },
      { id: "2", name: "Beta" },
    ]);

    expect(csv).toContain('"Acme, ""LLC"""');
    expect(csv.split("\n")).toHaveLength(3);
  });

  it("returns empty string for no rows", () => {
    expect(rowsToCsv([])).toBe("");
  });
});

describe("bundleToCsvFiles", () => {
  it("creates one csv per table", () => {
    const bundle: UserExportBundle = {
      exportedAt: "2026-07-01T00:00:00.000Z",
      userId: "user-1",
      profile: { id: "user-1", full_name: "Alex" },
      brandKit: null,
      clients: [{ id: "c1", name: "Client A" }],
      projects: [],
      tasks: [],
      documents: [],
      lineItems: [],
      services: [],
      recurringInvoices: [],
      recurringInvoiceRuns: [],
      payments: [],
      invoiceAdjustments: [],
      expenses: [],
      timeEntries: [],
      documentTemplates: [],
      notifications: [],
      subscriptions: [],
      consentLog: [],
    };

    const files = bundleToCsvFiles(bundle);
    expect(files["clients.csv"]).toContain("Client A");
    expect(files["profile.csv"]).toContain("Alex");
    expect(files["README.txt"]).toContain("Manpower");
  });
});

describe("summarizeBundle", () => {
  it("returns counts for key tables", () => {
    const summary = summarizeBundle({
      exportedAt: "2026-07-01T00:00:00.000Z",
      userId: "user-1",
      profile: null,
      brandKit: null,
      clients: [{ id: "1" }, { id: "2" }],
      projects: [],
      tasks: [],
      documents: [],
      lineItems: [],
      services: [],
      recurringInvoices: [],
      recurringInvoiceRuns: [],
      payments: [],
      invoiceAdjustments: [],
      expenses: [],
      timeEntries: [],
      documentTemplates: [],
      notifications: [],
      subscriptions: [],
      consentLog: [],
    });

    expect(summary.find((item) => item.label === "Clients")?.count).toBe(2);
  });
});

describe("account validation schemas", () => {
  it("validates delete account confirmation", () => {
    const ok = deleteAccountSchema.safeParse({
      password: "secret123",
      confirmation: DELETE_ACCOUNT_CONFIRMATION,
      acknowledged: true,
    });
    expect(ok.success).toBe(true);

    const bad = deleteAccountSchema.safeParse({
      password: "secret123",
      confirmation: "delete",
      acknowledged: true,
    });
    expect(bad.success).toBe(false);
  });

  it("validates password change match", () => {
    const ok = changePasswordSchema.safeParse({
      currentPassword: "old-pass",
      newPassword: "new-pass-1",
      confirmPassword: "new-pass-1",
    });
    expect(ok.success).toBe(true);
  });

  it("validates email format", () => {
    expect(changeEmailSchema.safeParse({ newEmail: "bad" }).success).toBe(false);
    expect(
      changeEmailSchema.safeParse({ newEmail: "good@example.com" }).success,
    ).toBe(true);
  });

  it("recognizes export formats", () => {
    expect(isExportFormat("csv")).toBe(true);
    expect(isExportFormat("xml")).toBe(false);
  });
});
