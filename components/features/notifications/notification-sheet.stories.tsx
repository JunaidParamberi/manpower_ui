import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { NotificationRow } from "@/types";

import { NotificationSheet } from "./notification-sheet";

function n(
  id: string,
  type: NotificationRow["type"],
  title: string,
  href: string,
  createdAt: string,
  read = false,
  body?: string,
): NotificationRow {
  return {
    id,
    user_id: "u1",
    type,
    payload: { href, entity_id: id, title, ...(body ? { body } : {}) },
    read_at: read ? "2026-08-29T10:00:00Z" : null,
    action_taken_at: null,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

const meta: Meta<typeof NotificationSheet> = {
  title: "Features/Notifications/NotificationSheet",
  component: NotificationSheet,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Right-side panel behind the topbar bell. Groups notifications into unread/read, then by time bucket, and offers the two bulk actions. " +
          "Use it for passive catch-up on invoice payments, quote approvals, and client activity — not for anything the user must act on immediately (that belongs on the dashboard attention queue). " +
          "Focus behaviour matters here: the sheet opens with focus on the title row, not on a control, because the destructive \"Clear all\" used to take opening focus and fire on Enter. " +
          "\"Clear all\" lives in the footer so it is last in tab order and reads as secondary to \"Mark all read\", and it arms rather than fires: the first click swaps it for a count-bearing \"Delete all N notifications?\" prompt with Delete and Cancel, since clearing has no undo. Reopening the panel always starts disarmed.",
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
    browserPermission: "granted" as NotificationPermission,
  },
};

export default meta;
type Story = StoryObj<typeof NotificationSheet>;

const mixed: NotificationRow[] = [
  n(
    "1",
    "invoice_paid",
    "Invoice #INV-2051 paid",
    "/documents/1",
    "2026-08-29T08:30:00Z",
    false,
    "Acme Design Co. · $2,400.00",
  ),
  n(
    "2",
    "quote_approved",
    "Quote #QUO-0012 approved",
    "/documents/2",
    "2026-08-29T07:10:00Z",
    false,
    "Zenith Studio",
  ),
  n(
    "3",
    "daily_digest",
    "2 projects need attention",
    "/dashboard",
    "2026-08-28T06:00:00Z",
    true,
    "Bright Apps Landing Page — 20 days past its deadline",
  ),
];

export const Default: Story = {
  args: { notifications: mixed, unreadCount: 2 },
};

export const AllRead: Story = {
  name: "All read (no bulk mark action)",
  args: {
    notifications: mixed.map((item) => ({
      ...item,
      read_at: "2026-08-29T10:00:00Z",
    })),
    unreadCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          "With nothing unread the header action row disappears entirely, so the first focusable element after the title row is a notification row — never the footer's \"Clear all\".",
      },
    },
  },
};

export const Empty: Story = {
  args: { notifications: [], unreadCount: 0 },
  parameters: {
    docs: {
      description: {
        story:
          "No notifications at all: both bulk actions are hidden and the empty state explains what will eventually land here.",
      },
    },
  },
};

export const BrowserPermissionPrompt: Story = {
  args: {
    notifications: mixed,
    unreadCount: 2,
    browserPermission: "default" as NotificationPermission,
  },
};

export const BrowserPermissionDenied: Story = {
  args: {
    notifications: mixed,
    unreadCount: 2,
    browserPermission: "denied" as NotificationPermission,
  },
};
