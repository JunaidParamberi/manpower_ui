import { describe, expect, it } from "vitest";

import {
  buildClientOverviewRow,
  computeClientMoneyDue,
  countActiveClientsSince,
  getLatestClientActivityAt,
  sumClientInvoiceRevenue,
} from "./clients-overview-queries";

const baseClient = {
  id: "client-1",
  user_id: "user-1",
  name: "Hawthorn & Co",
  contact_name: "Theo Bramwell",
  email: "theo@hawthorn.co",
  phone: null,
  company: "Hawthorn",
  address: "London, UK",
  currency: "aed",
  notes: null,
  health_score: 92,
  portal_token: "portal-token",
  created_at: "2026-05-01T10:00:00.000Z",
  updated_at: "2026-05-03T10:00:00.000Z",
};

describe("sumClientInvoiceRevenue", () => {
  it("sums collected invoice payments with a paid-invoice fallback", () => {
    const revenue = sumClientInvoiceRevenue([
      {
        type: "invoice",
        status: "paid",
        discount_type: "percent",
        discount_value: 10,
        line_items: [
          { quantity: 2, unit_price: 100, tax_rate: 5 },
          { quantity: 1, unit_price: 50, tax_rate: 0 },
        ],
        payments: [{ amount: 180 }],
      },
      {
        type: "invoice",
        status: "partially_paid",
        discount_type: "flat",
        discount_value: 25,
        line_items: [{ quantity: 1, unit_price: 200, tax_rate: 10 }],
        payments: [{ amount: 80 }, { amount: 20 }],
      },
      {
        type: "invoice",
        status: "written_off",
        discount_type: "flat",
        discount_value: 0,
        line_items: [{ quantity: 1, unit_price: 200, tax_rate: 0 }],
        payments: [{ amount: 40 }],
      },
      {
        type: "invoice",
        status: "paid",
        discount_type: "flat",
        discount_value: 0,
        line_items: [{ quantity: 1, unit_price: 50, tax_rate: 0 }],
        payments: [],
      },
      {
        type: "invoice",
        status: "sent",
        discount_type: "flat",
        discount_value: 0,
        line_items: [{ quantity: 1, unit_price: 999, tax_rate: 0 }],
        payments: [],
      },
      {
        type: "quote",
        status: "paid",
        discount_type: "flat",
        discount_value: 0,
        line_items: [{ quantity: 1, unit_price: 999, tax_rate: 0 }],
        payments: [{ amount: 999 }],
      },
    ]);

    expect(revenue).toBe(370);
  });
});

describe("getLatestClientActivityAt", () => {
  it("uses the latest client, project, or document timestamp", () => {
    expect(
      getLatestClientActivityAt({
        updated_at: "2026-05-03T10:00:00.000Z",
        projects: [
          { updated_at: "2026-05-04T10:00:00.000Z" },
          { updated_at: "2026-05-05T10:00:00.000Z" },
        ],
        documents: [
          {
            created_at: "2026-05-06T10:00:00.000Z",
            updated_at: "2026-05-07T10:00:00.000Z",
          },
          {
            created_at: "2026-05-02T10:00:00.000Z",
            updated_at: "2026-05-02T10:00:00.000Z",
          },
        ],
      }),
    ).toBe("2026-05-07T10:00:00.000Z");
  });
});

describe("buildClientOverviewRow", () => {
  it("normalizes client fields and derives project count, revenue, activity, and recent documents", () => {
    const overview = buildClientOverviewRow({
      ...baseClient,
      projects: [
        { id: "project-1", updated_at: "2026-05-04T10:00:00.000Z" },
        { id: "project-2", updated_at: "2026-05-05T10:00:00.000Z" },
      ],
      documents: [
        {
          id: "doc-1",
          type: "invoice",
          status: "paid",
          title: "Invoice INV-1",
          invoice_number: "INV-1",
          quote_number: null,
          receipt_number: null,
          created_at: "2026-05-06T10:00:00.000Z",
          updated_at: "2026-05-08T10:00:00.000Z",
          due_date: null,
          discount_type: "flat",
          discount_value: 0,
          line_items: [{ quantity: 1, unit_price: 300, tax_rate: 0 }],
          payments: [],
        },
        {
          id: "doc-2",
          type: "quote",
          status: "sent",
          title: "Quote Q-1",
          invoice_number: null,
          quote_number: "Q-1",
          receipt_number: null,
          created_at: "2026-05-07T10:00:00.000Z",
          updated_at: "2026-05-07T10:00:00.000Z",
          due_date: null,
          discount_type: "flat",
          discount_value: 0,
          line_items: [],
          payments: [],
        },
      ],
    });

    expect(overview.currency).toBe("AED");
    expect(overview.projects_count).toBe(2);
    expect(overview.revenue_total).toBe(300);
    expect(overview.last_activity_at).toBe("2026-05-08T10:00:00.000Z");
    expect(overview.recent_documents).toEqual([
      {
        id: "doc-2",
        type: "quote",
        status: "sent",
        title: "Quote Q-1",
        invoice_number: null,
        quote_number: "Q-1",
        receipt_number: null,
        amount: 0,
        created_at: "2026-05-07T10:00:00.000Z",
      },
      {
        id: "doc-1",
        type: "invoice",
        status: "paid",
        title: "Invoice INV-1",
        invoice_number: "INV-1",
        quote_number: null,
        receipt_number: null,
        amount: 300,
        created_at: "2026-05-06T10:00:00.000Z",
      },
    ]);
  });
});

describe("buildClientOverviewRow money", () => {
  it("adds owed amounts to the overview row", () => {
    const row = buildClientOverviewRow(
      {
        ...baseClient,
        projects: [],
        documents: [
          {
            id: "d1", type: "invoice", status: "sent", title: "Invoice", invoice_number: "INV-1",
            quote_number: null, receipt_number: null, created_at: "2026-09-01T00:00:00.000Z",
            updated_at: "2026-09-01T00:00:00.000Z", due_date: "2026-09-30", discount_type: null,
            discount_value: 0, line_items: [{ quantity: 1, unit_price: 500, tax_rate: 0 }], payments: [],
          },
        ],
      },
      "2026-10-09T00:00:00.000Z",
    );
    expect(row.outstanding_total).toBe(500);
    expect(row.overdue_total).toBe(500);
    expect(row.overdue_days).toBe(9);
    expect(row.next_due_date).toBe("2026-09-30");
  });
});

describe("computeClientMoneyDue", () => {
  const now = "2026-10-09T10:00:00.000Z";
  type MoneyDoc = Parameters<typeof computeClientMoneyDue>[0][number];
  const inv = (o: Partial<MoneyDoc>): MoneyDoc => ({
    type: "invoice",
    status: "sent",
    due_date: null,
    discount_type: "flat",
    discount_value: 0,
    tax_mode: null,
    tax_rate: null,
    line_items: [{ quantity: 1, unit_price: 1000, tax_rate: 0 }],
    payments: [],
    ...o,
  });

  it("returns zeros with no open invoices", () => {
    expect(computeClientMoneyDue([], now)).toEqual({
      outstanding_total: 0,
      overdue_total: 0,
      overdue_days: 0,
      next_due_date: null,
    });
  });

  it("counts the unpaid balance of a partially paid overdue invoice", () => {
    const result = computeClientMoneyDue(
      [inv({ status: "partially_paid", due_date: "2026-09-30", payments: [{ amount: 400 }] })],
      now,
    );
    expect(result).toEqual({ outstanding_total: 600, overdue_total: 600, overdue_days: 9, next_due_date: "2026-09-30" });
  });

  it("is not overdue on the due date itself", () => {
    const result = computeClientMoneyDue([inv({ due_date: "2026-10-09" })], now);
    expect(result.overdue_total).toBe(0);
    expect(result.outstanding_total).toBe(1000);
    expect(result.next_due_date).toBe("2026-10-09");
  });

  it("ignores settled and non-invoice documents", () => {
    const result = computeClientMoneyDue(
      [
        inv({ status: "paid", due_date: "2026-09-01" }),
        inv({ status: "draft", due_date: "2026-09-01" }),
        inv({ status: "voided", due_date: "2026-09-01" }),
        inv({ status: "written_off", due_date: "2026-09-01" }),
        inv({ type: "quote", due_date: "2026-09-01" }),
      ],
      now,
    );
    expect(result.outstanding_total).toBe(0);
  });

  it("reports the oldest overdue days and the earliest due date", () => {
    const result = computeClientMoneyDue(
      [inv({ due_date: "2026-10-20" }), inv({ due_date: "2026-09-20" }), inv({ due_date: "2026-10-01" })],
      now,
    );
    expect(result.overdue_days).toBe(19);
    expect(result.overdue_total).toBe(2000);
    expect(result.outstanding_total).toBe(3000);
    expect(result.next_due_date).toBe("2026-09-20");
  });
});

describe("computeClientMoneyDue currency", () => {
  const now = "2026-10-09T10:00:00.000Z";
  const doc = (currency: string | null) => ({
    type: "invoice" as const, status: "sent" as const, due_date: null, currency,
    discount_type: "flat", discount_value: 0, tax_mode: null, tax_rate: null,
    line_items: [{ quantity: 1, unit_price: 100, tax_rate: 0 }], payments: [],
  });
  it("only sums invoices in the client's currency (case-insensitive, missing currency counts)", () => {
    expect(computeClientMoneyDue([doc("GBP"), doc("usd"), doc(null), doc("gbp")], now, "GBP").outstanding_total).toBe(300);
  });
  it("sums everything when the client has no currency", () => {
    expect(computeClientMoneyDue([doc("GBP"), doc("USD")], now, null).outstanding_total).toBe(200);
  });
});

describe("countActiveClientsSince", () => {
  it("counts clients with activity on or after the threshold", () => {
    expect(
      countActiveClientsSince(
        [
          { last_activity_at: "2026-05-07T10:00:00.000Z" },
          { last_activity_at: "2026-05-01T10:00:00.000Z" },
          { last_activity_at: null },
        ],
        "2026-05-05T00:00:00.000Z",
      ),
    ).toBe(1);
  });
});
