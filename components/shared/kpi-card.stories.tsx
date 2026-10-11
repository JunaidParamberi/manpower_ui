import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Users, FileText } from "lucide-react";

import { KpiCard } from "./kpi-card";

const meta: Meta<typeof KpiCard> = {
  title: "Shared/KpiCard",
  component: KpiCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof KpiCard>;

export const Default: Story = {
  args: {
    label: "Total Revenue",
    value: "AED 42,500",
    delta: "+12%",
    trend: "up",
    sub: "vs. last month",
  },
};

export const TrendDown: Story = {
  args: {
    label: "Outstanding",
    value: "AED 8,200",
    delta: "-5%",
    trend: "down",
    variant: "danger",
    sub: "3 invoices overdue",
  },
};

export const Warning: Story = {
  args: {
    label: "Overdue",
    value: "AED 3,100",
    variant: "warning",
    sub: "2 invoices past due",
  },
};

export const Interactive: Story = {
  args: {
    label: "Clients",
    value: "12",
    icon: Users,
    tone: "info",
    active: true,
    onClick: () => {},
  },
};

export const AsLink: Story = {
  args: {
    label: "Documents",
    value: "28",
    icon: FileText,
    tone: "success",
    href: "#",
  },
};

export const Flat: Story = {
  args: {
    label: "Avg Pay Days",
    value: "14",
    delta: "0%",
    trend: "flat",
  },
};
