import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Separator } from "./separator";

const meta: Meta<typeof Separator> = {
  title: "Base/Separator",
  component: Separator,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="space-y-2 w-64">
      <p className="text-sm">Section one content</p>
      <Separator />
      <p className="text-sm">Section two content</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-3">
      <span className="text-sm">Clients</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Projects</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Documents</span>
    </div>
  ),
};

export const InNav: Story = {
  render: () => (
    <div className="flex flex-col gap-1 w-48">
      <p className="text-sm px-2 py-1.5 hover:bg-muted rounded cursor-pointer">Dashboard</p>
      <p className="text-sm px-2 py-1.5 hover:bg-muted rounded cursor-pointer">Clients</p>
      <Separator className="my-1" />
      <p className="text-sm px-2 py-1.5 text-muted-foreground">Settings</p>
      <p className="text-sm px-2 py-1.5 hover:bg-muted rounded cursor-pointer">Billing</p>
    </div>
  ),
};
