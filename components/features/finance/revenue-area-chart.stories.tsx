import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RevenueAreaChart } from "./revenue-area-chart";

const meta: Meta<typeof RevenueAreaChart> = {
  title: "Features/Finance/RevenueAreaChart",
  component: RevenueAreaChart,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ width: 720 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RevenueAreaChart>;

export const Default: Story = {
  args: {
    currency: "AED",
    data: [
      { month: "Dec 2025", monthKey: "2025-12", revenue: 18000, isCurrent: false },
      { month: "Jan 2026", monthKey: "2026-01", revenue: 22000, isCurrent: false },
      { month: "Feb 2026", monthKey: "2026-02", revenue: 28000, isCurrent: false },
      { month: "Mar 2026", monthKey: "2026-03", revenue: 31000, isCurrent: false },
      { month: "Apr 2026", monthKey: "2026-04", revenue: 35000, isCurrent: false },
      { month: "May 2026", monthKey: "2026-05", revenue: 42500, isCurrent: true },
    ],
  },
};

export const SinglePoint: Story = {
  args: {
    currency: "USD",
    data: [{ month: "May 2026", monthKey: "2026-05", revenue: 5000, isCurrent: true }],
  },
};

export const Empty: Story = { args: { currency: "AED", data: [] } };
