import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { NotificationRow } from "@/types";

import { NotificationItem } from "./notification-item";

function n(
  id: string,
  type: NotificationRow["type"],
  title: string,
  href: string,
  read = false,
  body?: string,
): NotificationRow {
  return {
    id,
    user_id: "u1",
    type,
    payload: { href, entity_id: id, title, ...(body ? { body } : {}) },
    read_at: read ? "2026-05-22T10:00:00Z" : null,
    action_taken_at: null,
    created_at: "2026-05-22T09:00:00Z",
    updated_at: "2026-05-22T09:00:00Z",
  };
}

const meta: Meta<typeof NotificationItem> = {
  title: "Features/Notifications/NotificationItem",
  component: NotificationItem,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "One row in the notification panel. The payload's `title` is the scannable line and `body` the muted supporting detail — a row with no body is legitimate (older rows, and events with nothing more to add) and must still read as complete. Unread rows are shown by weight alone — in the sheet they already sit under an \"Unread\" heading, so a bar or a dot would only restate it. Screen readers get an sr-only \"Unread\" prefix. Timestamps use the compact form (\"14h ago\"), not the activity feed's \"about 14 hours ago\".",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 400, border: "1px solid var(--border)", borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NotificationItem>;

export const InvoicePaidUnread: Story = {
  args: {
    notification: n(
      "1",
      "invoice_paid",
      "Invoice #INV-2051 paid",
      "/documents/1",
      false,
      "Acme Design Co. · $2,400.00",
    ),
  },
};

export const Read: Story = {
  args: {
    notification: n(
      "2",
      "invoice_paid",
      "Invoice #INV-2050 paid",
      "/documents/2",
      true,
      "Zenith Studio · $960.00",
    ),
  },
};

export const QuoteApproved: Story = {
  args: {
    notification: n(
      "3",
      "quote_approved",
      "Quote #QUO-0012 approved",
      "/documents/3",
      false,
      "Maple Co.",
    ),
  },
};

export const QuoteDeclined: Story = {
  args: {
    notification: n(
      "4",
      "quote_declined",
      "Quote #QUO-0013 declined",
      "/documents/4",
      false,
      "Northwind",
    ),
  },
};

export const TaskOverdue: Story = {
  args: {
    notification: n(
      "5",
      "task_overdue",
      "Design homepage",
      "/tasks",
      false,
      "Overdue · Bright Apps Landing Page",
    ),
  },
};

export const NoBody: Story = {
  name: "Title only (no supporting line)",
  args: {
    notification: n("6", "doc_sent", "Receipt #RCP-0004 sent", "/documents/6"),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Rows written before the title/body split fold their single string into the title, and some events have nothing to add. The row keeps its rhythm without a body.",
      },
    },
  },
};

export const RecentlyReceived: Story = {
  name: "Compact timestamp",
  args: {
    notification: {
      ...n("8", "invoice_paid", "Invoice #INV-2049 paid", "/documents/8"),
      payload: {
        href: "/documents/8",
        entity_id: "8",
        title: "Invoice #INV-2049 paid",
        body: "Northwind · $3,150.00",
      },
      created_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Fourteen hours old. The list reads \"14h ago\" — date-fns' \"about 14 hours ago\" is a hedge that adds nothing when every row carries one.",
      },
    },
  },
};

export const LongBody: Story = {
  name: "Digest with a long supporting line",
  args: {
    notification: n(
      "7",
      "daily_digest",
      "3 projects need attention",
      "/dashboard",
      false,
      "Bright Apps Landing Page — 20 days past its deadline with 4 tasks still open and no client contact in 62 days.",
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "The body clamps at two lines so one verbose producer cannot push the rest of the list off screen.",
      },
    },
  },
};
