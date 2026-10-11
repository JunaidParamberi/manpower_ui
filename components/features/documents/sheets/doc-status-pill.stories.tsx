import type { Meta, StoryObj } from "@storybook/react";
import { DocStatusPill } from "./doc-status-pill";

const meta: Meta<typeof DocStatusPill> = {
  title: "Documents/Sheets/DocStatusPill",
  component: DocStatusPill,
  parameters: {
    docs: {
      description: {
        component:
          "Status badge used in document headers and lists. Shows invoice/proposal lifecycle state. Use `variant` to signal urgency. Never use for non-document status.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warn", "accent"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof DocStatusPill>;

export const Draft: Story = {
  args: { label: "Draft", variant: "default", dot: true },
};

export const Sent: Story = {
  args: { label: "Sent · awaiting payment", variant: "accent", dot: true },
};

export const Paid: Story = {
  args: { label: "Paid", variant: "success", dot: true },
};

export const Overdue: Story = {
  args: { label: "Overdue", variant: "warn", dot: true },
};

export const NoDot: Story = {
  name: "Paid (no dot)",
  args: { label: "Paid", variant: "success", dot: false },
};

export const AllVariants: Story = {
  name: "All variants",
  render: () => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
      <DocStatusPill label="Draft" variant="default" />
      <DocStatusPill label="Sent" variant="accent" />
      <DocStatusPill label="Paid" variant="success" />
      <DocStatusPill label="Overdue" variant="warn" />
    </div>
  ),
};
