import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { QueueSection } from "./queue-section";
import type { QueueItem } from "@/lib/dashboard/snapshot-types";

function item(partial: Partial<QueueItem> = {}): QueueItem {
  return {
    type: "overdue_invoice",
    id: "inv-1",
    score: 180,
    href: "/documents/inv-1",
    title: "Invoice #INV-2051",
    detail: "12 days overdue",
    amount: 9975,
    currency: "AED",
    clientId: "c1",
    clientName: "Acme Design Co.",
    clientEmail: "billing@acme.test",
    action: {
      documentId: "inv-1", projectId: null, taskId: null,
      invoiceTotal: 9975, totalPaid: 0, totalWrittenOff: 0, remainingBalance: 9975,
      suggestedSubject: "Invoice INV-2051 — payment reminder", suggestedBody: "Hi Acme,",
    },
    ...partial,
  };
}

/**
 * The ranked triage list that sits directly under the money row.
 *
 * Use it as the dashboard's primary working surface: the highest-scoring
 * signals across money, work and clients, most urgent first. The empty state is
 * the good case and says so. Snoozed items are counted at the foot so nothing
 * disappears without a way back.
 */
const meta: Meta<typeof QueueSection> = {
  title: "Features/Dashboard/QueueSection",
  component: QueueSection,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof QueueSection>;

export const Default: Story = {
  args: {
    snoozedCount: 0,
    items: [
      item(),
      item({
        type: "quote_not_invoiced",
        id: "q-1",
        title: "Quote #QUO-0012",
        detail: "approved 9 days ago, not invoiced",
        amount: 18000,
        clientName: "Maple Co.",
      }),
      item({
        type: "draft_unsent",
        id: "d-1",
        title: "Website redesign",
        detail: "draft, unsent for 11 days",
        amount: 5000,
        clientEmail: null,
      }),
    ],
  },
};

export const WithSnoozedItems: Story = {
  args: { snoozedCount: 3, items: [item()] },
};

export const Empty: Story = {
  args: { items: [], snoozedCount: 0 },
};