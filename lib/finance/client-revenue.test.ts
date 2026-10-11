import { describe, expect, it } from "vitest";

import { buildClientRevenueRows } from "./client-revenue";

const invoice = (
  clientId: string,
  clientName: string,
  amount: number,
  options: {
    quantity?: number;
    taxRate?: number;
    discountType?: "percent" | "flat";
    discountValue?: number;
  } = {},
) => ({
  client_id: clientId,
  clients: { name: clientName },
  discount_type: options.discountType ?? "percent",
  discount_value: options.discountValue ?? 0,
  line_items: [
    {
      quantity: options.quantity ?? 1,
      unit_price: amount,
      tax_rate: options.taxRate ?? 0,
    },
  ],
});

describe("buildClientRevenueRows", () => {
  it("groups paid invoice totals by client and sorts by revenue descending", () => {
    const rows = buildClientRevenueRows([
      invoice("client-a", "North Studio", 100),
      invoice("client-b", "Blue Labs", 300),
      invoice("client-a", "North Studio", 50),
    ]);

    expect(rows).toEqual([
      {
        clientId: "client-b",
        clientName: "Blue Labs",
        total: 300,
        percentage: 66.67,
      },
      {
        clientId: "client-a",
        clientName: "North Studio",
        total: 150,
        percentage: 33.33,
      },
    ]);
  });

  it("uses line item quantity, tax, and document discount in each invoice total", () => {
    const rows = buildClientRevenueRows([
      invoice("client-a", "North Studio", 100, {
        quantity: 2,
        taxRate: 10,
        discountType: "percent",
        discountValue: 10,
      }),
    ]);

    // Canonical formula: per-line discount before tax
    // subtotal=200, discount=20 → 180, tax=10%→18, total=198
    expect(rows).toEqual([
      {
        clientId: "client-a",
        clientName: "North Studio",
        total: 198,
        percentage: 100,
      },
    ]);
  });

  it("keeps the top five clients and groups the remaining revenue as Others", () => {
    const rows = buildClientRevenueRows([
      invoice("client-a", "A", 600),
      invoice("client-b", "B", 500),
      invoice("client-c", "C", 400),
      invoice("client-d", "D", 300),
      invoice("client-e", "E", 200),
      invoice("client-f", "F", 100),
      invoice("client-g", "G", 50),
    ]);

    expect(rows).toHaveLength(6);
    expect(rows.map((row) => row.clientName)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "Others",
    ]);
    expect(rows[5]).toEqual({
      clientId: "others",
      clientName: "Others",
      total: 150,
      percentage: 6.98,
    });
  });

  it("returns an empty list when there is no client revenue", () => {
    expect(
      buildClientRevenueRows([
        invoice("client-a", "North Studio", 0),
        {
          client_id: null,
          clients: null,
          discount_type: "percent",
          discount_value: 0,
          line_items: [],
        },
      ]),
    ).toEqual([]);
  });
});

describe("buildClientRevenueRows — payment-sourced rows", () => {
  it("uses the received amount instead of the invoice's line-item total", () => {
    const rows = buildClientRevenueRows([
      { client_id: "c1", clients: { name: "Acme" }, amount: 400 },
      { client_id: "c1", clients: { name: "Acme" }, amount: 100 },
      { client_id: "c2", clients: { name: "Globex" }, amount: 500 },
    ]);
    expect(rows).toEqual([
      { clientId: "c1", clientName: "Acme", total: 500, percentage: 50 },
      { clientId: "c2", clientName: "Globex", total: 500, percentage: 50 },
    ]);
  });
});
