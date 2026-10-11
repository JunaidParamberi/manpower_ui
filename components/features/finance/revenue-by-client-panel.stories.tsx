import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RevenueByClientPanel } from "./revenue-by-client-panel";

const meta: Meta<typeof RevenueByClientPanel> = {
  title: "Features/Finance/RevenueByClientPanel",
  component: RevenueByClientPanel,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RevenueByClientPanel>;

export const Default: Story = {
  args: {
    currency: "AED",
    dateLabel: "This year",
    rows: [
      { clientId: "c1", clientName: "Acme Design Co.", total: 24500, percentage: 48 },
      { clientId: "c2", clientName: "Zenith Studio", total: 14000, percentage: 28 },
      { clientId: "c3", clientName: "Maple Co.", total: 8000, percentage: 16 },
      { clientId: "c4", clientName: "Northwind", total: 4000, percentage: 8 },
    ],
  },
};

export const Empty: Story = {
  args: { currency: "AED", dateLabel: "This year", rows: [] },
};
