import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InvoiceBalanceRail } from "./invoice-balance-rail";

/**
 * What has been paid on an invoice: a progress bar, the money rows, payment history and the pay link.
 * Use in the invoice rail. Not for quotes or LPOs, which have no balance.
 */
const meta: Meta<typeof InvoiceBalanceRail> = {
  title: "Features/Documents/Workspace/InvoiceBalanceRail",
  component: InvoiceBalanceRail,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-[300px] bg-[var(--panel)]"><Story /></div>],
  args: { payments: [], currency: "AED", homeCurrency: "AED", voucherByPaymentId: {}, payUrl: "https://app.manpower.com/pay/9f2c1a7e", latestReceipt: null },
};
export default meta;
type Story = StoryObj<typeof InvoiceBalanceRail>;

export const Unpaid: Story = { args: { balance: { invoiceTotal: 13440, totalPaid: 0, totalWrittenOff: 0, balanceDue: 13440 } } };
export const PartlyPaid: Story = { args: { balance: { invoiceTotal: 13440, totalPaid: 5000, totalWrittenOff: 0, balanceDue: 8440 } } };
export const PaidWithReceipt: Story = {
  args: { balance: { invoiceTotal: 13440, totalPaid: 13440, totalWrittenOff: 0, balanceDue: 0 }, latestReceipt: { id: "r1", receipt_number: "RCT-0012" } },
};
export const NoBalance: Story = { args: { balance: null } };
