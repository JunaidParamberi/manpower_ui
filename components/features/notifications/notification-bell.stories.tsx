import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { NotificationRow } from "@/types";

import { NotificationBell } from "./notification-bell";

const sample: NotificationRow[] = [
  {
    id: "1",
    user_id: "u1",
    type: "invoice_paid",
    payload: {
      href: "/documents/1",
      entity_id: "1",
      title: "Invoice #INV-2051 paid",
      body: "Acme Design Co. · $2,400.00",
    },
    read_at: null,
    action_taken_at: null,
    created_at: "2026-05-22T09:00:00Z",
    updated_at: "2026-05-22T09:00:00Z",
  },
  {
    id: "2",
    user_id: "u1",
    type: "quote_approved",
    payload: {
      href: "/documents/2",
      entity_id: "2",
      title: "Quote #QUO-0012 approved",
      body: "Maple Co.",
    },
    read_at: null,
    action_taken_at: null,
    created_at: "2026-05-22T08:00:00Z",
    updated_at: "2026-05-22T08:00:00Z",
  },
];

const meta: Meta<typeof NotificationBell> = {
  title: "Features/Notifications/NotificationBell",
  component: NotificationBell,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof NotificationBell>;

export const NoUnread: Story = {
  args: { notifications: [], unreadCount: 0 },
};

export const WithUnread: Story = {
  args: { notifications: sample, unreadCount: 2 },
};

export const ManyUnread: Story = {
  args: { notifications: sample, unreadCount: 12 },
};
