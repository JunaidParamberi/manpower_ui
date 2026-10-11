import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PaperTotals } from "./paper-totals";

/**
 * The totals block on the paper. "+ Add discount" and "+ Add tax" and the amounts jump to the rail control.
 * Use under the line items of invoices, quotes, proposals and LPOs. Not for dashboards: use KpiCard.
 */
const meta: Meta<typeof PaperTotals> = {
  title: "Features/Documents/Workspace/Paper/PaperTotals",
  component: PaperTotals,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="sheet sheet--edit !w-[420px] !p-8"><Story /></div>],
  args: { currency: "AED", readOnly: false, onFocusDiscount: () => {}, onFocusTax: () => {} },
};
export default meta;
type Story = StoryObj<typeof PaperTotals>;

const base = { subtotal: 12800, discount: 0, discountedSubtotal: 12800, taxTotal: 0, total: 12800 };

export const NoDiscountNoTax: Story = { args: { totals: base, discountLabel: null, taxLabel: null } };
export const VatAndDiscount: Story = {
  args: { totals: { subtotal: 12800, discount: 1280, discountedSubtotal: 11520, taxTotal: 576, total: 12096 }, discountLabel: "Discount 10%", taxLabel: "VAT 5%" },
};
export const WithTds: Story = {
  args: { totals: { ...base, taxTotal: 640, total: 13440 }, discountLabel: null, taxLabel: "VAT 5%", tds: { rate: 10, amount: 1280 } },
};
export const ReadOnly: Story = { args: { readOnly: true, totals: { ...base, taxTotal: 640, total: 13440 }, discountLabel: null, taxLabel: "VAT 5%" } };
