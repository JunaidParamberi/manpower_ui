import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Info, Settings, Trash2 } from "lucide-react";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Base/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="flex items-center justify-center p-8">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent>This is a tooltip</TooltipContent>
    </Tooltip>
  ),
};

export const OnIcon: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon"><Info size={16} /></Button>} />
      <TooltipContent>More information about this field</TooltipContent>
    </Tooltip>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon"><Trash2 size={16} /></Button>} />
      <TooltipContent>Delete this document permanently</TooltipContent>
    </Tooltip>
  ),
};

export const BottomSide: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Bottom tooltip</Button>} />
      <TooltipContent side="bottom">Opens below the trigger</TooltipContent>
    </Tooltip>
  ),
};

export const LeftSide: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Left tooltip</Button>} />
      <TooltipContent side="left">Opens to the left</TooltipContent>
    </Tooltip>
  ),
};

export const RightSide: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Right tooltip</Button>} />
      <TooltipContent side="right">Opens to the right</TooltipContent>
    </Tooltip>
  ),
};

export const AllSides: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      {(["top", "bottom", "left", "right"] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger render={<Button variant="outline" size="sm">{side}</Button>} />
          <TooltipContent side={side}>Tooltip on {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
};
