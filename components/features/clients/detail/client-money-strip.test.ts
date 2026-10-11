import { describe, expect, it } from "vitest";

import type { ClientFinancialSummary } from "@/lib/clients/client-financial-summary";
import { buildMoneyCells } from "./client-money-strip";

const base: ClientFinancialSummary = {
  currency: "AED",
  billedTotal: 48200,
  paidTotal: 41800,
  outstandingTotal: 6400,
  overdueTotal: 6400,
  overdueCount: 1,
  oldestOverdueDays: 9,
  invoiceCount: 9,
  otherCurrencyCount: 0,
  avgDaysToPay: 18,
  previousAvgDaysToPay: 11,
};

describe("buildMoneyCells", () => {
  it("flags overdue money", () => {
    const [, outstanding] = buildMoneyCells(base, 2, 1);
    expect(outstanding.alert).toBe(true);
    expect(outstanding.sub).toBe("1 overdue · 9 days");
  });
  it("says nothing is overdue when all is clear", () => {
    const [, outstanding] = buildMoneyCells({ ...base, overdueCount: 0, oldestOverdueDays: 0 }, 2, 1);
    expect(outstanding.alert).toBeFalsy();
    expect(outstanding.sub).toBe("nothing overdue");
  });
  it("compares with the previous days to pay", () => {
    expect(buildMoneyCells(base, 2, 1)[2]).toMatchObject({ value: "18 days", sub: "was 11 days" });
  });
  it("shows a dash when nothing has been paid yet", () => {
    const cells = buildMoneyCells({ ...base, avgDaysToPay: null, previousAvgDaysToPay: null }, 0, 0);
    expect(cells[2]).toMatchObject({ value: "—", sub: "no paid invoices yet" });
  });
  it("mentions invoices left out because they are in another currency", () => {
    expect(buildMoneyCells({ ...base, otherCurrencyCount: 2 }, 0, 0)[0].sub).toBe("lifetime · 9 invoices · 2 in other currencies");
  });
  it("uses singular day and invoice", () => {
    const cells = buildMoneyCells({ ...base, avgDaysToPay: 1, previousAvgDaysToPay: null, invoiceCount: 1 }, 0, 0);
    expect(cells[2].value).toBe("1 day");
    expect(cells[0].sub).toBe("lifetime · 1 invoice");
  });
});
