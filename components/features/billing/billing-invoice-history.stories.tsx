import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BillingInvoiceHistory } from "./billing-invoice-history";
import type { BillingInvoice } from "@/lib/billing/invoice-transform";

const meta: Meta<typeof BillingInvoiceHistory> = {
  title: "Features/Billing/BillingInvoiceHistory",
  component: BillingInvoiceHistory,
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof BillingInvoiceHistory>;

const invoices: BillingInvoice[] = [
  {
    id: "1",
    status: "paid",
    totalFormatted: "AED 179.00",
    totalCents: 17900,
    currency: "AED",
    invoiceUrl: "https://app.lemonsqueezy.com/my-orders/abc/subscription-invoice/1",
    createdAt: "2026-06-01T10:00:00.000Z",
    isTestMode: false,
  },
  {
    id: "2",
    status: "paid",
    totalFormatted: "AED 179.00",
    totalCents: 17900,
    currency: "AED",
    invoiceUrl: "https://app.lemonsqueezy.com/my-orders/abc/subscription-invoice/2",
    createdAt: "2026-05-01T10:00:00.000Z",
    isTestMode: false,
  },
  {
    id: "3",
    status: "refunded",
    totalFormatted: "AED 179.00",
    totalCents: 17900,
    currency: "AED",
    invoiceUrl: null,
    createdAt: "2026-04-01T10:00:00.000Z",
    isTestMode: false,
  },
];

export const WithInvoices: Story = {
  args: { invoices },
};

export const Empty: Story = {
  args: { invoices: [] },
};

export const SingleInvoice: Story = {
  args: { invoices: [invoices[0]] },
};

export const PendingStatus: Story = {
  args: {
    invoices: [
      { ...invoices[0], id: "4", status: "pending", totalFormatted: "AED 69.00", totalCents: 6900 },
    ],
  },
};
