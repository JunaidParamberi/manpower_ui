import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AiPanelProvider } from "@/lib/ai-panel/context";

import { MoreSheet } from "./more-sheet";

/**
 * The mobile overflow menu, opened from the last slot of `MobileTabBar`. It
 * carries the navigation that does not fit the tab bar, plus the theme toggle
 * and account actions that live in the sidebar footer on desktop.
 */
const meta: Meta<typeof MoreSheet> = {
  title: "Layout/MoreSheet",
  component: MoreSheet,
  tags: ["autodocs"],
  // The sheet offers "Ask AI", so it reads useAiPanel() and cannot render
  // outside the provider.
  decorators: [
    (Story) => (
      <AiPanelProvider>
        <Story />
      </AiPanelProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Mobile-only overflow sheet. Use it for navigation and account actions that do not fit the tab bar; do not put a primary action here, since it costs two taps to reach. On desktop this content lives in the sidebar footer instead.",
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
    userEmail: "jane@atlasstudio.com",
    userName: "Jane Doe",
    userInitials: "JD",
    planUsage: {
      planTier: "starter",
      clientCount: 6,
      docCountThisMonth: 14,
    },
  },
};

export default meta;
type Story = StoryObj<typeof MoreSheet>;

export const Default: Story = {};

export const FreePlanNearLimit: Story = {
  name: "Free plan, near limit",
  args: {
    planUsage: { planTier: "free", clientCount: 3, docCountThisMonth: 4 },
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
