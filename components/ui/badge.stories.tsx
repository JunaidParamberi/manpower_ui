import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";

const meta: Meta<typeof Badge> = {
  title: "Base/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Badge" },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: "secondary", children: "Secondary" } };
export const Outline: Story = { args: { variant: "outline", children: "Outline" } };
export const Destructive: Story = { args: { variant: "destructive", children: "Destructive" } };
export const Success: Story = { args: { variant: "success", children: "Paid" } };
export const Warning: Story = { args: { variant: "warning", children: "Pending" } };
export const Danger: Story = { args: { variant: "danger", children: "Overdue" } };
export const Info: Story = { args: { variant: "info", children: "Sent" } };
export const Accent: Story = { args: { variant: "accent", children: "New" } };

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="accent">Accent</Badge>
    </div>
  ),
};
