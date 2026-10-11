import type { Meta, StoryObj } from "@storybook/react";
import { DocLineItems } from "./doc-line-items";

const STANDARD_ITEMS = [
  {
    id: "1",
    description: "Brand Identity Design",
    subDescription: "Logo, colour palette, typography system",
    quantity: 1,
    unitPrice: 4500,
    taxRate: 5,
  },
  {
    id: "2",
    description: "Website Design (5 pages)",
    subDescription: null,
    quantity: 1,
    unitPrice: 3200,
    taxRate: 5,
  },
  {
    id: "3",
    description: "Revision rounds",
    subDescription: null,
    quantity: 3,
    unitPrice: 500,
    taxRate: 5,
  },
];

const WITH_OPTIONAL = [
  ...STANDARD_ITEMS,
  {
    id: "4",
    description: "Social media kit",
    subDescription: "10 templates for Instagram / LinkedIn",
    quantity: 1,
    unitPrice: 1800,
    taxRate: 5,
    isOptional: true,
  },
];

const meta: Meta<typeof DocLineItems> = {
  title: "Documents/Sheets/DocLineItems",
  component: DocLineItems,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Line items table used across Invoice, Quote, and Delivery Note sheets. Optional items render muted with a '+' prefix. `statusMode` swaps the amount column with a delivery status indicator.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DocLineItems>;

export const Invoice: Story = {
  args: {
    items: STANDARD_ITEMS,
    descHeader: "Description",
    amountHeader: "Amount",
  },
};

export const WithOptionals: Story = {
  name: "Quote with optional items",
  args: {
    items: WITH_OPTIONAL,
    descHeader: "Deliverable",
    amountHeader: "Price",
  },
};

export const DeliveryNote: Story = {
  name: "Delivery note (status mode)",
  args: {
    items: STANDARD_ITEMS,
    descHeader: "Item",
    amountHeader: "Status",
    statusMode: true,
  },
};

export const SingleItem: Story = {
  args: {
    items: [
      {
        id: "1",
        description: "Monthly retainer — June 2026",
        subDescription: null,
        quantity: 1,
        unitPrice: 8000,
        taxRate: 5,
      },
    ],
  },
};

/** India GST invoice — HSN/SAC column appears when any line carries a code. */
export const IndiaHsnSac: Story = {
  name: "India — HSN/SAC codes",
  args: {
    items: [
      {
        id: "1",
        description: "Graphic Design Services",
        subDescription: "Brand identity & logo system",
        quantity: 1,
        unitPrice: 50000,
        taxRate: 18,
        hsnSac: "998391",
      },
      {
        id: "2",
        description: "Printed Brochures",
        subDescription: null,
        quantity: 500,
        unitPrice: 12,
        taxRate: 12,
        hsnSac: "4911",
      },
      {
        id: "3",
        description: "Courier Charges",
        subDescription: null,
        quantity: 1,
        unitPrice: 350,
        taxRate: 18,
        hsnSac: "996819",
      },
    ],
    descHeader: "Description",
    amountHeader: "Amount",
  },
};

/** Confirms the HSN/SAC column is hidden when no codes are present. */
export const NoHsnSac: Story = {
  name: "No HSN/SAC (column hidden)",
  args: {
    items: STANDARD_ITEMS,
  },
};

/**
 * India invoice line items subject to TDS. The DocLineItems table itself
 * does not render TDS totals — use DocTotals (WithTDS story) for that.
 * This story shows the line item table that pairs with a TDS-enabled totals block.
 */
export const WithTDS: Story = {
  name: "India — items subject to TDS deduction",
  args: {
    items: [
      {
        id: "1",
        description: "UI/UX Design Services",
        subDescription: "End-to-end product design, 3 rounds of revisions",
        quantity: 1,
        unitPrice: 100000,
        taxRate: 18,
        hsnSac: "998391",
      },
      {
        id: "2",
        description: "Frontend Development",
        subDescription: "React/Next.js implementation",
        quantity: 80,
        unitPrice: 1500,
        taxRate: 18,
        hsnSac: "998314",
      },
    ],
    descHeader: "Description",
    amountHeader: "Amount",
  },
};
