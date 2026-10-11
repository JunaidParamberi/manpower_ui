import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { NotificationRow } from "@/types";

import { SidebarProvider } from "@/components/ui/sidebar";

import { AppHeader } from "./app-header";

const mockNotifications: NotificationRow[] = [
  {
    id: "n1",
    user_id: "u1",
    type: "invoice_paid",
    payload: {
      href: "/documents/d1",
      entity_id: "d1",
      title: "Invoice #INV-0042 paid",
      body: "Acme Design Co. · $1,800.00",
    },
    read_at: null,
    action_taken_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const meta: Meta<typeof AppHeader> = {
  title: "Layout/AppHeader",
  component: AppHeader,
  tags: ["autodocs"],
  // AppHeader reads useSidebar() for the collapse toggle, so it cannot render
  // outside a provider — without this every story failed with "useSidebar must
  // be used within a SidebarProvider", which is why the shell had no visual
  // baseline to refactor against.
  decorators: [
    (Story) => (
      <SidebarProvider>
        <Story />
      </SidebarProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "App shell topbar: breadcrumb, bordered Search pill (⌘K, wider than the old chip), notification bell, and theme toggle. Ask AI lives in the sidebar — not here. Mobile Search collapses to icon-only; theme moves to the More sheet.",
      },
    },
  },
  args: {
    notifications: mockNotifications,
    unreadCount: 1,
    onOpenSearch: () => {},
    userName: "Layla Hassan",
    userEmail: "layla@cedarmedia.ae",
    userInitials: "LH",
    planUsage: { planTier: "starter", clientCount: 6, docCountThisMonth: 14 },
  },
};

export default meta;
type Story = StoryObj<typeof AppHeader>;

export const Default: Story = {};

export const NoUnread: Story = {
  args: {
    notifications: [],
    unreadCount: 0,
  },
};

export const ManyUnread: Story = {
  args: {
    unreadCount: 12,
  },
};
