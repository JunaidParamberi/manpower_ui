import { describe, it, expect } from "vitest";
import {
  detectRevenueSwing,
  detectOverdueSpike,
  detectLargeInvoices,
  detectAnomalies,
  type MonthlyMetric,
  type InvoiceAmount,
} from "./anomaly-detect";

function months(values: number[], startMonth = "2026-04"): MonthlyMetric[] {
  const [startY, startM] = startMonth.split("-").map(Number);
  return values.map((value, i) => {
    const d = new Date(Date.UTC(startY, startM - 1 + i, 1));
    const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { monthKey, value };
  });
}

describe("detectRevenueSwing", () => {
  it("flags a >30% drop vs trailing 3-month average", () => {
    const data = months([1000, 1000, 1000, 600]); // avg 1000, current 600 = -40%
    const result = detectRevenueSwing(data);
    expect(result).not.toBeNull();
    expect(result?.type).toBe("revenue_swing");
    expect(result?.metric.changePct).toBeLessThan(-30);
  });

  it("flags a >30% spike vs trailing 3-month average", () => {
    const data = months([1000, 1000, 1000, 1500]); // +50%
    const result = detectRevenueSwing(data);
    expect(result).not.toBeNull();
    expect(result?.metric.changePct).toBeGreaterThan(30);
  });

  it("does not flag a swing under 30%", () => {
    const data = months([1000, 1000, 1000, 1100]); // +10%
    expect(detectRevenueSwing(data)).toBeNull();
  });

  it("returns null with fewer than 4 months of data", () => {
    const data = months([1000, 1000, 600]);
    expect(detectRevenueSwing(data)).toBeNull();
  });

  it("returns null when trailing average is zero", () => {
    const data = months([0, 0, 0, 500]);
    expect(detectRevenueSwing(data)).toBeNull();
  });
});

describe("detectOverdueSpike", () => {
  it("flags a >30% spike vs trailing 3-month average", () => {
    const data = months([200, 200, 200, 400]);
    const result = detectOverdueSpike(data);
    expect(result).not.toBeNull();
    expect(result?.type).toBe("overdue_spike");
    expect(result?.metric.changePct).toBeGreaterThan(30);
  });

  it("does not flag a swing under 30%", () => {
    const data = months([200, 200, 200, 220]);
    expect(detectOverdueSpike(data)).toBeNull();
  });

  it("returns null with fewer than 4 months of data", () => {
    expect(detectOverdueSpike(months([200, 200]))).toBeNull();
  });
});

describe("detectLargeInvoices", () => {
  it("flags an invoice over 2x the per-client average when the client has >=3 other invoices", () => {
    const invoices: InvoiceAmount[] = [
      { id: "a", clientId: "client-1", amount: 100 },
      { id: "b", clientId: "client-1", amount: 100 },
      { id: "c", clientId: "client-1", amount: 100 },
      { id: "d", clientId: "client-1", amount: 300 }, // 3x the 100 avg
    ];
    const result = detectLargeInvoices(invoices);
    expect(result).toHaveLength(1);
    expect(result[0].metric.invoiceId).toBe("d");
  });

  it("falls back to the overall average when the client has fewer than 3 other invoices", () => {
    const invoices: InvoiceAmount[] = [
      { id: "a", clientId: "client-1", amount: 100 },
      { id: "b", clientId: "client-2", amount: 100 },
      { id: "c", clientId: "client-3", amount: 100 },
      { id: "d", clientId: "client-4", amount: 300 }, // only invoice for client-4, uses overall avg
    ];
    const result = detectLargeInvoices(invoices);
    expect(result.map((a) => a.metric.invoiceId)).toContain("d");
  });

  it("returns an empty array for no invoices", () => {
    expect(detectLargeInvoices([])).toEqual([]);
  });

  it("does not flag invoices within 2x the baseline", () => {
    const invoices: InvoiceAmount[] = [
      { id: "a", clientId: "client-1", amount: 100 },
      { id: "b", clientId: "client-1", amount: 100 },
      { id: "c", clientId: "client-1", amount: 100 },
      { id: "d", clientId: "client-1", amount: 150 },
    ];
    expect(detectLargeInvoices(invoices)).toEqual([]);
  });
});

describe("detectAnomalies", () => {
  it("composes all three rules without dropping or duplicating results", () => {
    const monthlyRevenue = months([1000, 1000, 1000, 600]);
    const monthlyOverdue = months([200, 200, 200, 200]);
    const paidInvoices: InvoiceAmount[] = [
      { id: "a", clientId: "client-1", amount: 100 },
      { id: "b", clientId: "client-1", amount: 100 },
      { id: "c", clientId: "client-1", amount: 100 },
      { id: "d", clientId: "client-1", amount: 300 },
    ];
    const result = detectAnomalies({ monthlyRevenue, monthlyOverdue, paidInvoices });
    expect(result).toHaveLength(2); // revenue_swing + large_invoice, no overdue_spike
    expect(result.map((a) => a.type).sort()).toEqual(["large_invoice", "revenue_swing"]);
  });
});
