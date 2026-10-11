import type { Meta, StoryObj } from "@storybook/react";
import { DocTotals } from "./doc-totals";

const meta: Meta<typeof DocTotals> = {
  title: "Documents/Sheets/DocTotals",
  component: DocTotals,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Renders the totals section (subtotal / discount / tax lines / grand total) beneath line items in a document sheet. " +
          "Supports multiple tax breakdown lines (e.g. CGST + SGST, or a single VAT line) via `taxLines`. " +
          "**When to use:** any document sheet that needs a totals summary block (Invoice, Quote, Receipt, etc.). " +
          "**When not to use:** LPO sheets — those use their own totals block via `computeLpoSheetTotals` which has different logic.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DocTotals>;

const tdsDefaults = { tds: 0, tdsRate: null, netReceived: 0 } as const;

export const Simple: Story = {
  args: {
    totals: { subtotal: 9200, discount: 0, discountLabel: null, tax: 0, taxLabel: null, taxLines: [], total: 9200, ...tdsDefaults, netReceived: 9200 },
    currency: "AED",
  },
};

export const WithDiscount: Story = {
  args: {
    totals: { subtotal: 9200, discount: 920, discountLabel: "Discount (10%)", tax: 0, taxLabel: null, taxLines: [], total: 8280, ...tdsDefaults, netReceived: 8280 },
    currency: "AED",
  },
};

export const WithTax: Story = {
  args: {
    totals: {
      subtotal: 9200,
      discount: 0,
      discountLabel: null,
      tax: 460,
      taxLabel: "VAT 5%",
      taxLines: [{ label: "VAT 5%", rate: 5, amount: 460 }],
      total: 9660,
      ...tdsDefaults,
      netReceived: 9660,
    },
    currency: "AED",
  },
};

export const WithDiscountAndTax: Story = {
  args: {
    totals: {
      subtotal: 9200,
      discount: 920,
      discountLabel: "Discount (10%)",
      tax: 414,
      taxLabel: "VAT 5%",
      taxLines: [{ label: "VAT 5%", rate: 5, amount: 414 }],
      total: 8694,
      ...tdsDefaults,
      netReceived: 8694,
    },
    currency: "USD",
  },
};

export const WithOptionals: Story = {
  name: "Quote with optional items",
  args: {
    totals: { subtotal: 9200, discount: 0, discountLabel: null, tax: 0, taxLabel: null, taxLines: [], total: 9200, ...tdsDefaults, netReceived: 9200 },
    currency: "AED",
    grandLabel: "Total (AED)",
    withOptionals: 1800,
  },
};

export const Vat: Story = {
  args: {
    totals: {
      subtotal: 1000,
      discount: 0,
      discountLabel: null,
      tax: 50,
      taxLabel: "VAT 5%",
      taxLines: [{ label: "VAT 5%", rate: 5, amount: 50 }],
      total: 1050,
      ...tdsDefaults,
      netReceived: 1050,
    },
    currency: "AED",
  },
};

export const CgstSgst: Story = {
  args: {
    totals: {
      subtotal: 1000,
      discount: 0,
      discountLabel: null,
      tax: 180,
      taxLabel: null,
      taxLines: [
        { label: "CGST 9%", rate: 9, amount: 90 },
        { label: "SGST 9%", rate: 9, amount: 90 },
      ],
      total: 1180,
      ...tdsDefaults,
      netReceived: 1180,
    },
    currency: "INR",
  },
};

export const NoTax: Story = {
  args: {
    totals: {
      subtotal: 1000,
      discount: 0,
      discountLabel: null,
      tax: 0,
      taxLabel: null,
      taxLines: [],
      total: 1000,
      ...tdsDefaults,
      netReceived: 1000,
    },
    currency: "USD",
  },
};

/** India invoice with GST + TDS deduction — shows TDS row and net received. */
export const WithTDS: Story = {
  name: "India — TDS deduction (10%)",
  args: {
    totals: {
      subtotal: 100000,
      discount: 0,
      discountLabel: null,
      tax: 18000,
      taxLabel: null,
      taxLines: [
        { label: "CGST 9%", rate: 9, amount: 9000 },
        { label: "SGST 9%", rate: 9, amount: 9000 },
      ],
      total: 118000,
      tds: 10000,       // 10% of taxable subtotal (pre-GST)
      tdsRate: 10,
      netReceived: 108000,
    },
    currency: "INR",
  },
};
