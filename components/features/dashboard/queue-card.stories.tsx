import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { QueueCard } from "./queue-card";
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
      documentId: "inv-1",
      projectId: null,
      taskId: null,
      invoiceTotal: 9975,
      totalPaid: 0,
      totalWrittenOff: 0,
      remainingBalance: 9975,
      suggestedSubject: "Invoice INV-2051 — payment reminder",
      suggestedBody: "Hi Acme Design Co.,\n\nInvoice INV-2051 is now 12 days past due.",
    },
    ...partial,
  };
}

const noopActions = {
  snooze: async () => ({ ok: true }),
  dismiss: async () => ({ ok: true }),
  undo: async () => ({ ok: true }),
};

/**
 * One item in the dashboard's "Needs you" queue.
 *
 * Use it for anything the freelancer should act on today. Each card carries a
 * primary action, a record-payment dialog when money is owed, and an overflow
 * menu with snooze and dismiss. Snooze and dismiss apply optimistically with an
 * Undo toast; money and email actions go through their own dialogs and only
 * commit on success.
 *
 * Don't use it for passive information — that belongs in the rail cards.
 */
const meta: Meta<typeof QueueCard> = {
  title: "Features/Dashboard/QueueCard",
  component: QueueCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { onRemoved: () => {}, onRestored: () => {}, actions: noopActions },
};

export default meta;
type Story = StoryObj<typeof QueueCard>;

export const OverdueInvoice: Story = { args: { item: item() } };

export const Narrow: Story = {
  ...OverdueInvoice,
  name: "Narrow lane (actions wrap under the text)",
  decorators: [
    (StoryFn) => (
      <div className="max-w-[360px]">
        <StoryFn />
      </div>
    ),
  ],
};

export const PartiallyPaidInvoice: Story = {
  args: {
    item: item({
      detail: "20 days overdue",
      amount: 3975,
      action: {
        ...item().action,
        totalPaid: 6000,
        remainingBalance: 3975,
      },
    }),
  },
};

export const ApprovedNeverInvoiced: Story = {
  args: {
    item: item({
      type: "quote_not_invoiced",
      id: "q-1",
      title: "Quote #QUO-0012",
      detail: "approved 9 days ago, not invoiced",
      amount: 18000,
      action: { ...item().action, documentId: "q-1", remainingBalance: null, invoiceTotal: null, totalPaid: null, totalWrittenOff: null },
    }),
  },
};

export const StaleDraft: Story = {
  args: {
    item: item({
      type: "draft_unsent",
      id: "d-1",
      title: "Website redesign",
      detail: "draft, unsent for 11 days",
      amount: 5000,
      clientEmail: null,
      action: { ...item().action, documentId: "d-1", remainingBalance: null, invoiceTotal: null, totalPaid: null, totalWrittenOff: null },
    }),
  },
};

export const OverdueTask: Story = {
  args: {
    item: item({
      type: "overdue_task",
      id: "t-1",
      title: "Send final logo files",
      detail: "Brand refresh · 3 days overdue",
      amount: null,
      currency: null,
      clientEmail: null,
      action: { ...item().action, documentId: null, projectId: "p-1", taskId: "t-1", remainingBalance: null, invoiceTotal: null, totalPaid: null, totalWrittenOff: null },
    }),
  },
};