import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AccountMenu } from "./account-menu";

/**
 * The avatar menu at the top right of the app header. Click the avatar to open
 * it: identity and plan, an Upgrade button below Pro, usage bars for limited
 * plans, billing / settings / support, a Light / Dark / System switch and
 * sign-out. Desktop only; mobile uses the More sheet. Don't put navigation
 * here — the sidebar owns that (including Customize navigation).
 */
const meta: Meta<typeof AccountMenu> = {
  title: "Layout/AccountMenu",
  component: AccountMenu,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="flex justify-end pr-4">
        <Story />
      </div>
    ),
  ],
  args: {
    userName: "Layla Hassan",
    userEmail: "layla@cedarmedia.ae",
    userInitials: "LH",
    planUsage: { planTier: "starter", clientCount: 6, docCountThisMonth: 14 },
    onSignOut: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof AccountMenu>;

export const Starter: Story = {};

export const FreeNearLimit: Story = {
  name: "Free plan, near limit",
  args: { planUsage: { planTier: "free", clientCount: 3, docCountThisMonth: 4 } },
};

export const Pro: Story = {
  name: "Pro (no upgrade, no usage bars)",
  args: { planUsage: { planTier: "pro", clientCount: 42, docCountThisMonth: 120 } },
};

export const LongName: Story = {
  args: {
    userName: "Mohammed Abdulrahman Al-Farsi Consulting",
    userEmail: "mohammed.abdulrahman.alfarsi@consulting-partners.ae",
    userInitials: "MA",
  },
};
