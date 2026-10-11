import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DocumentsTypeEmpty } from "./documents-type-empty";

const meta: Meta<typeof DocumentsTypeEmpty> = {
  title: "Features/Documents/DocumentsTypeEmpty",
  component: DocumentsTypeEmpty,
  parameters: {
    layout: "centered",
    nextjs: { appDirectory: true },
    docs: {
      description: {
        component:
          "Detail-pane empty state shown on a type-filtered documents route (e.g. /documents/invoices) when the user has no documents of that type. Offers a single quick-create card for the type plus the AI-from-scratch shortcut. Use only inside the documents shell's detail pane; not a standalone page.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DocumentsTypeEmpty>;

export const Invoices: Story = { args: { type: "invoice" } };
export const Quotes: Story = { args: { type: "quote" } };
export const Proposals: Story = { args: { type: "proposal" } };
export const PurchaseOrders: Story = { args: { type: "local_purchase_order" } };
export const Receipts: Story = { args: { type: "receipt" } };
