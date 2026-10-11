import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Toggle } from "./toggle";

const meta: Meta<typeof Toggle> = {
  title: "Base/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  args: { children: "Toggle" },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {};
export const Outline: Story = { args: { variant: "outline", children: "Outline" } };

export const Small: Story = { args: { size: "sm", children: "Small" } };
export const Large: Story = { args: { size: "lg", children: "Large" } };

export const Pressed: Story = {
  args: { defaultPressed: true, children: "Pressed" },
};

export const Disabled: Story = {
  args: { disabled: true, children: "Disabled" },
};

export const IconToggle: Story = {
  render: () => (
    <div className="flex items-center gap-1">
      <Toggle size="sm" aria-label="Bold">
        <Bold />
      </Toggle>
      <Toggle size="sm" aria-label="Italic">
        <Italic />
      </Toggle>
      <Toggle size="sm" aria-label="Underline">
        <Underline />
      </Toggle>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Toggle variant="default">Default</Toggle>
      <Toggle variant="outline">Outline</Toggle>
      <Toggle size="sm">Small</Toggle>
      <Toggle size="lg">Large</Toggle>
      <Toggle defaultPressed>Pressed</Toggle>
      <Toggle disabled>Disabled</Toggle>
    </div>
  ),
};
