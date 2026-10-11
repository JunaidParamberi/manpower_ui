import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { LineItemRow } from "@/types";

import { DocumentPaperLineItems } from "./document-paper-line-items";

const sample: LineItemRow[] = [
  {
    id: "li1",
    document_id: "d1",
    description: "UI/UX Design — Homepage + 5 inner pages",
      notes: null,
    quantity: 1,
    unit_price: 3500,
    tax_rate: 5,
    sort_order: 0,
    hsn_sac_code: null,
    created_at: "2026-05-14T09:00:00Z",
    updated_at: "2026-05-14T09:00:00Z",
  },
  {
    id: "li2",
    document_id: "d1",
    description: "Frontend Development — React/Next.js",
      notes: null,
    quantity: 40,
    unit_price: 150,
    tax_rate: 5,
    sort_order: 1,
    hsn_sac_code: null,
    created_at: "2026-05-14T09:00:00Z",
    updated_at: "2026-05-14T09:00:00Z",
  },
];

const meta: Meta<typeof DocumentPaperLineItems> = {
  title: "Features/Documents/DocumentPaperLineItems",
  component: DocumentPaperLineItems,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ background: "#fff", padding: 24, maxWidth: 800 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DocumentPaperLineItems>;

export const Default: Story = {
  args: { lineItems: sample, currency: "AED" },
};

export const WithPercentDiscount: Story = {
  args: {
    lineItems: sample,
    currency: "AED",
    discountValue: 10,
    discountType: "percent",
  },
};

export const WithFlatDiscount: Story = {
  args: {
    lineItems: sample,
    currency: "USD",
    discountValue: 500,
    discountType: "flat",
  },
};

export const Empty: Story = {
  args: { lineItems: [], currency: "AED" },
};

/** India invoice showing TDS deduction row and net received amount. */
export const WithTDS: Story = {
  name: "India — TDS deduction (10%)",
  args: {
    lineItems: [
      {
        id: "li1",
        document_id: "d1",
        description: "UI/UX Design Services",
      notes: null,
        quantity: 1,
        unit_price: 100000,
        tax_rate: 18,
        sort_order: 0,
        hsn_sac_code: "998391",
        created_at: "2026-05-14T09:00:00Z",
        updated_at: "2026-05-14T09:00:00Z",
      },
    ],
    currency: "INR",
    tdsEnabled: true,
    tdsRate: 10,
  },
};
