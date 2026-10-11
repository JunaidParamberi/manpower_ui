import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PlanUsageBars } from "./plan-usage-bars";

const meta: Meta<typeof PlanUsageBars> = {
  title: "Features/Billing/PlanUsageBars",
  component: PlanUsageBars,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 260, padding: 12, border: "1px solid var(--border)", borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PlanUsageBars>;

export const Low: Story = {
  args: { usage: { planTier: "free", clientCount: 1, docCountThisMonth: 1 } },
};

export const Medium: Story = {
  args: { usage: { planTier: "free", clientCount: 2, docCountThisMonth: 3 } },
};

export const AtLimit: Story = {
  args: { usage: { planTier: "free", clientCount: 3, docCountThisMonth: 5 } },
};

export const StarterTier: Story = {
  args: { usage: { planTier: "starter", clientCount: 12, docCountThisMonth: 60 } },
};
