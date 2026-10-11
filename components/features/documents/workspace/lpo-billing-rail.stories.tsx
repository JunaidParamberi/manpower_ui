import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LpoBillingRail } from "./lpo-billing-rail";

/**
 * What has been billed against a client's purchase order: progress against the ceiling, the invoices raised
 * and a link to the client's PDF. Use in the LPO rail. Not for invoices: use InvoiceBalanceRail.
 */
const meta: Meta<typeof LpoBillingRail> = {
  title: "Features/Documents/Workspace/LpoBillingRail",
  component: LpoBillingRail,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-[300px] bg-[var(--panel)]"><Story /></div>],
  args: { documentId: "lpo1", currency: "AED", pdfUrl: null },
};
export default meta;
type Story = StoryObj<typeof LpoBillingRail>;

const progress = (invoiced: number, paid: number) => ({
  lpo_amount: 20000, invoiced_amount: invoiced, paid_amount: paid, invoiced_pct: (invoiced / 20000) * 100, paid_pct: (paid / 20000) * 100, over_ceiling: invoiced > 20000,
});

export const NoInvoices: Story = { args: { progress: progress(0, 0), linkedInvoices: [] } };
export const HalfBilled: Story = {
  args: {
    progress: progress(10000, 4000),
    pdfUrl: "https://example.com/lpo.pdf",
    linkedInvoices: [{ id: "i1", title: "Invoice", invoice_number: "INV-0040", status: "partially_paid" }],
  },
};
export const OverCeiling: Story = {
  args: {
    progress: progress(22000, 22000),
    linkedInvoices: [
      { id: "i1", title: "Invoice", invoice_number: "INV-0040", status: "paid" },
      { id: "i2", title: "Invoice", invoice_number: "INV-0041", status: "paid" },
    ],
  },
};
