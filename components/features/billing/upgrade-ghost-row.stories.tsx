import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UpgradeGhostRow } from "./upgrade-ghost-row";

const meta: Meta<typeof UpgradeGhostRow> = {
  title: "Features/Billing/UpgradeGhostRow",
  component: UpgradeGhostRow,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UpgradeGhostRow>;

export const Default: Story = {
  args: {
    title: "Add 7 more clients",
    description: "Upgrade to Starter for 15 clients (AED 69/mo)",
  },
};

export const DocumentsLimit: Story = {
  args: {
    title: "Unlock unlimited documents",
    description: "You've used 4 of 5 docs this month on Free",
  },
};
