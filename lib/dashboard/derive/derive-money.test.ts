import { describe, expect, it } from "vitest";

import { deriveMoney } from "@/lib/dashboard/derive/derive-money";

const NOW = new Date("2026-09-13T09:00:00.000Z");

describe("deriveMoney", () => {
  it("reports the currency the money is actually in, not the profile default", () => {
    const money = deriveMoney({
      baseCurrency: "INR",
      payments: [{ amount: 6240, currency: "AED" }],
      previousPayments: [],
      openInvoices: [],
      paidInvoices: [],
      now: NOW,
    });
    expect(money.primaryCurrency).toBe("AED");
    expect(money.totalRevenue).toBe(6240);
  });

  it("keeps other currencies visible in byCurrency", () => {
    const money = deriveMoney({
      baseCurrency: "AED",
      payments: [
        { amount: 500, currency: "AED" },
        { amount: 800, currency: "USD" },
      ],
      previousPayments: [],
      openInvoices: [],
      paidInvoices: [],
      now: NOW,
    });
    expect(money.byCurrency.map((b) => b.currency)).toEqual(["AED", "USD"]);
  });

  it("counts only the balance still owed as outstanding", () => {
    const money = deriveMoney({
      baseCurrency: "AED",
      payments: [],
      previousPayments: [],
      openInvoices: [
        { total: 1000, paid: 400, writtenOff: 100, currency: "AED", dueDate: null },
      ],
      paidInvoices: [],
      now: NOW,
    });
    expect(money.outstanding).toBe(500);
    expect(money.outstandingCount).toBe(1);
  });

  it("compares the previous period in the same currency as the headline", () => {
    const money = deriveMoney({
      baseCurrency: "INR",
      payments: [{ amount: 200, currency: "AED" }],
      previousPayments: [
        { amount: 100, currency: "AED" },
        { amount: 9999, currency: "USD" },
      ],
      openInvoices: [],
      paidInvoices: [],
      now: NOW,
    });
    expect(money.primaryCurrency).toBe("AED");
    expect(money.revenueChangePct).toBe(100);
  });

  it("averages pay time across paid invoices", () => {
    const money = deriveMoney({
      baseCurrency: "AED",
      payments: [],
      previousPayments: [],
      openInvoices: [],
      paidInvoices: [
        { sent_at: "2026-09-01T00:00:00.000Z", paid_at: "2026-09-05T00:00:00.000Z" },
        { sent_at: "2026-09-01T00:00:00.000Z", paid_at: "2026-09-07T00:00:00.000Z" },
      ],
      now: NOW,
    });
    expect(money.avgPayDays).toBe(5);
  });
});
