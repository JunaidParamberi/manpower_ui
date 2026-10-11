import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StatusBadge } from "./status-badge";

const meta: Meta<typeof StatusBadge> = {
  title: "Shared/StatusBadge",
  component: StatusBadge,
  tags: ["autodocs"],
  args: {
    status: "paid",
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Paid: Story = { args: { status: "paid" } };
export const Sent: Story = { args: { status: "sent" } };
export const Draft: Story = { args: { status: "draft" } };
export const Overdue: Story = { args: { status: "overdue" } };
export const PartiallyPaid: Story = { args: { status: "partially_paid" } };
export const WrittenOff: Story = { args: { status: "written_off" } };
export const Active: Story = { args: { status: "active" } };
export const Planning: Story = { args: { status: "planning" } };
export const Todo: Story = { args: { status: "todo" } };
export const InProgress: Story = { args: { status: "in_progress" } };
export const Done: Story = { args: { status: "done" } };
export const Cancelled: Story = { args: { status: "cancelled" } };
export const HighPriority: Story = { args: { status: "high" } };
export const MedPriority: Story = { args: { status: "med" } };
export const LowPriority: Story = { args: { status: "low" } };
export const Approved: Story = { args: { status: "approved" } };
export const Declined: Story = { args: { status: "declined" } };

export const WithDot: Story = {
  args: { status: "active", dot: true },
};

export const UnknownStatus: Story = {
  args: { status: "custom_status" },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {[
        "paid", "sent", "draft", "overdue", "partially_paid", "written_off",
        "active", "planning", "on_hold", "done", "todo", "in_progress",
        "cancelled", "high", "med", "low", "approved", "declined", "pending",
        "receipt",
      ].map((s) => (
        <StatusBadge key={s} status={s} />
      ))}
    </div>
  ),
};
