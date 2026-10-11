import type { Meta, StoryObj } from "@storybook/react";

import { ProposalPricingSheet } from "./proposal-pricing-sheet";
import { computeSheetTotals } from "./types";
import type { LineItemRow } from "@/types";

const line = (id: string, description: string, unit_price: number, tax_rate = 0): LineItemRow => ({
  id,
  document_id: "doc",
  description,
  notes: null,
  quantity: 1,
  unit_price,
  tax_rate,
  sort_order: Number(id),
  hsn_sac_code: null,
  created_at: "2026-09-28T00:00:00Z",
  updated_at: "2026-09-28T00:00:00Z",
});

const ITEMS = [line("1", "Brand identity", 8000), line("2", "Social launch kit", 2500)];
const totalsFor = (mode: "none" | "vat") =>
  computeSheetTotals(
    ITEMS.map((i) => ({ id: i.id, description: i.description, subDescription: null, quantity: 1, unitPrice: i.unit_price, taxRate: 0 })),
    0,
    "percent",
    mode,
    mode === "vat" ? 5 : 0,
  );

const meta: Meta<typeof ProposalPricingSheet> = {
  title: "Documents/Sheets/ProposalPricingSheet",
  component: ProposalPricingSheet,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Priced scope of a proposal on its own page of paper. Shown to clients on the public proposal page " +
          "under the cover and content, only when the proposal has line items. Totals come from " +
          "`computeSheetTotals` so VAT and discounts match the PDF and the in-app numbers.",
      },
    },
  },
  args: { lineItems: ITEMS, currency: "AED", proposalNumber: "PRO-0003", accentColor: "#2F7D4F" },
};

export default meta;
type Story = StoryObj<typeof ProposalPricingSheet>;

export const WithVat: Story = { name: "With VAT 5%", args: { totals: totalsFor("vat") } };

export const NoTax: Story = { name: "No tax", args: { totals: totalsFor("none") } };
