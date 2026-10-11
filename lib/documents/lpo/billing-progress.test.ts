import { describe, it, expect } from "vitest";
import { computeBillingProgress } from "./billing-progress";

describe("computeBillingProgress", () => {
  it("returns zero progress when no invoices", () => {
    const result = computeBillingProgress({
      lpoAmount: 10000,
      invoices: [],
    });
    expect(result.invoiced_amount).toBe(0);
    expect(result.paid_amount).toBe(0);
    expect(result.invoiced_pct).toBe(0);
    expect(result.paid_pct).toBe(0);
    expect(result.over_ceiling).toBe(false);
  });

  it("computes invoiced % correctly", () => {
    const result = computeBillingProgress({
      lpoAmount: 10000,
      invoices: [
        { total_amount: 3200, status: "sent" },
        { total_amount: 3200, status: "draft" },
      ],
    });
    expect(result.invoiced_amount).toBe(6400);
    expect(result.invoiced_pct).toBe(64);
    expect(result.paid_amount).toBe(0);
    expect(result.over_ceiling).toBe(false);
  });

  it("counts paid and partially_paid invoices toward paid_amount", () => {
    const result = computeBillingProgress({
      lpoAmount: 10000,
      invoices: [
        { total_amount: 5000, status: "paid" },
        { total_amount: 3000, status: "partially_paid" },
      ],
    });
    expect(result.paid_amount).toBe(8000);
    expect(result.paid_pct).toBe(80);
  });

  it("flags over_ceiling when invoiced exceeds lpo_amount", () => {
    const result = computeBillingProgress({
      lpoAmount: 10000,
      invoices: [
        { total_amount: 6000, status: "sent" },
        { total_amount: 5000, status: "draft" },
      ],
    });
    expect(result.invoiced_amount).toBe(11000);
    expect(result.invoiced_pct).toBe(110);
    expect(result.over_ceiling).toBe(true);
  });

  it("handles null lpo_amount gracefully", () => {
    const result = computeBillingProgress({
      lpoAmount: null,
      invoices: [{ total_amount: 5000, status: "paid" }],
    });
    expect(result.invoiced_pct).toBe(0);
    expect(result.paid_pct).toBe(0);
    expect(result.over_ceiling).toBe(false);
  });
});
