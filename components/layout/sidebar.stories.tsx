import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ShellLayoutProvider } from "@/lib/layout/shell-layout-context";
import { SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "./sidebar";

/**
 * The live app sidebar, rendered by `dashboard-shell`. It needs two providers:
 * `SidebarProvider` for collapsed/expanded state and `ShellLayoutProvider` for
 * the resizable width. Without them it throws, which is why it had no story —
 * and therefore no visual baseline — until now.
 */
const meta: Meta<typeof AppSidebar> = {
  title: "Layout/AppSidebar",
  component: AppSidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Primary app navigation: reorderable nav items, pinned entities, and a footer with Settings and Customize navigation (the account menu lives in the header). Rendered by `DashboardShell` on every signed-in screen. Collapsed state comes from `SidebarProvider`; width from `ShellLayoutProvider`.",
      },
    },
  },
  args: {
    unreadCount: 2,
    openTaskCount: 5,
    onOpenSearch: () => {},
  },
  decorators: [
    (Story) => (
      <ShellLayoutProvider>
        <SidebarProvider>
          <div style={{ display: "flex", height: "100vh" }}>
            <Story />
          </div>
        </SidebarProvider>
      </ShellLayoutProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AppSidebar>;

export const Expanded: Story = {};

export const Collapsed: Story = {
  decorators: [
    (Story) => (
      <ShellLayoutProvider>
        <SidebarProvider defaultOpen={false}>
          <div style={{ display: "flex", height: "100vh" }}>
            <Story />
          </div>
        </SidebarProvider>
      </ShellLayoutProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "Icon-only rail. Renders as a dark rail even in the light theme (`data-theme=\"dark\"` on the aside); labels are hidden and each item falls back to a tooltip on hover.",
      },
    },
  },
};

export const ExpandedDark: Story = {
  name: "Expanded in dark theme",
  decorators: [
    (Story) => (
      <div data-theme="dark" className="flex h-screen bg-[var(--frame)] p-2">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "Expanded follows the app theme: a light panel in light mode, this dark panel in dark mode, with the white wordmark.",
      },
    },
  },
};

export const WithPinnedItems: Story = {
  name: "With pinned items",
  args: {
    pinnedItems: [
      {
        id: "p1",
        item_type: "client",
        item_id: "c1",
        item_label: "Acme Design Co.",
        item_href: "/clients/c1",
        position: 0,
      },
      {
        id: "p2",
        item_type: "project",
        item_id: "pr1",
        item_label: "Brand Refresh 2026",
        item_href: "/projects/pr1",
        position: 1,
      },
    ],
  },
};

export const FooterHidden: Story = {
  name: "Footer hidden (mobile sheet)",
  args: { hideFooter: true },
};
