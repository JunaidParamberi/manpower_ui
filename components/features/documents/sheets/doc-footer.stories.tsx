import type { Meta, StoryObj } from "@storybook/react";
import { DocFooter } from "./doc-footer";

const PAYMENT_INSTRUCTIONS = [
  { label: "Bank", value: "Emirates NBD" },
  { label: "Account name", value: "Manpower Studio FZ-LLC" },
  { label: "IBAN", value: "AE070260001012345678901", isMono: true },
  { label: "SWIFT", value: "EBILAEAD", isMono: true },
];

const meta: Meta<typeof DocFooter> = {
  title: "Documents/Sheets/DocFooter",
  component: DocFooter,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Two-column footer block below totals. Left slot typically holds payment instructions or notes; right slot holds legal text, thank-you note, or signatures. At least one slot must have content.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DocFooter>;

export const WithPaymentInstructions: Story = {
  args: {
    leftTitle: "Payment Instructions",
    paymentInstructions: PAYMENT_INSTRUCTIONS,
    rightTitle: "Notes",
    rightContent: <p style={{ fontSize: 12, color: "#898E96" }}>Thank you for your business. Payment is due within 14 days.</p>,
  },
};

export const NotesOnly: Story = {
  args: {
    leftTitle: "Notes",
    leftContent: <p style={{ fontSize: 12 }}>All prices are in AED and inclusive of 5% VAT where applicable.</p>,
    rightTitle: "Terms",
    rightContent: <p style={{ fontSize: 12, color: "#898E96" }}>This quote is valid for 14 days from issue date.</p>,
  },
};

export const EmptySlots: Story = {
  args: {
    leftTitle: "Payment Instructions",
    rightTitle: "Notes",
  },
};
