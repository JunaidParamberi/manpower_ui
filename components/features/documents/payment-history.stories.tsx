import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { PaymentRow } from "@/types";

import { PaymentHistory } from "./payment-history";

const samplePayments: PaymentRow[] = [
  {
    id: "p1",
    document_id: "d1",
    user_id: "u1",
    amount: 5000,
    currency: "AED",
    fx_rate: null,
    method: "bank_transfer",
    reference: "TXN-20260515-001",
    notes: "Partial payment",
    paid_at: "2026-05-15T09:00:00Z",
    created_at: "2026-05-15T09:00:00Z",
    updated_at: "2026-05-15T09:00:00Z",
  },
  {
    id: "p2",
    document_id: "d1",
    user_id: "u1",
    amount: 4975,
    currency: "AED",
    fx_rate: null,
    method: "card",
    reference: "ch_3OabcXYZ",
    notes: "Final payment",
    paid_at: "2026-05-20T09:00:00Z",
    created_at: "2026-05-20T09:00:00Z",
    updated_at: "2026-05-20T09:00:00Z",
  },
];

const meta: Meta<typeof PaymentHistory> = {
  title: "Features/Documents/PaymentHistory",
  component: PaymentHistory,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof PaymentHistory>;

export const Default: Story = {
  args: {
    payments: samplePayments,
    currency: "AED",
    voucherByPaymentId: {
      p1: { id: "v1", receipt_number: "RCT-0001" },
      p2: { id: "v2", receipt_number: "RCT-0002" },
    },
  },
};

export const NoVouchers: Story = {
  args: {
    payments: samplePayments,
    currency: "AED",
  },
};

export const Empty: Story = {
  args: { payments: [], currency: "AED" },
};
