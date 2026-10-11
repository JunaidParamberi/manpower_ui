import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "Base/Button",
  component: Button,
  tags: ["autodocs"],
  args: { onClick: fn(), children: "Button" },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: "secondary", children: "Secondary" } };
export const Outline: Story = { args: { variant: "outline", children: "Outline" } };
export const Ghost: Story = { args: { variant: "ghost", children: "Ghost" } };
export const Destructive: Story = { args: { variant: "destructive", children: "Delete" } };
export const Link: Story = { args: { variant: "link", children: "Link" } };

export const SizeXs: Story = { args: { size: "xs", children: "Extra Small" } };
export const SizeSm: Story = { args: { size: "sm", children: "Small" } };
export const SizeLg: Story = { args: { size: "lg", children: "Large" } };

export const IconOnly: Story = { args: { size: "icon", children: <Settings size={16} /> } };
export const IconSm: Story = { args: { size: "icon-sm", children: <Settings size={14} /> } };
export const IconLg: Story = { args: { size: "icon-lg", children: <Settings size={18} /> } };

export const WithLeadingIcon: Story = {
  args: { children: <><Plus size={16} /> New Client</> },
};

export const Disabled: Story = { args: { disabled: true, children: "Disabled" } };

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive"><Trash2 size={16} /> Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon"><Settings size={16} /></Button>
      <Button size="icon-sm"><Settings size={14} /></Button>
      <Button size="icon-lg"><Settings size={18} /></Button>
    </div>
  ),
};
