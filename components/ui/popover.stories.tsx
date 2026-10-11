import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverTrigger,
} from "./popover";

const meta: Meta<typeof Popover> = {
  title: "Base/Popover",
  component: Popover,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Open popover</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="width">Width</Label>
            <Input id="width" defaultValue="100%" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="height">Height</Label>
            <Input id="height" defaultValue="auto" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const Simple: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button>Info</Button>} />
      <PopoverContent>
        <p className="text-sm text-muted-foreground">
          Invoices are sent via email. You can resend them from the document detail page.
        </p>
      </PopoverContent>
    </Popover>
  ),
};

export const TopSide: Story = {
  render: () => (
    <div className="pt-24">
      <Popover>
        <PopoverTrigger render={<Button variant="outline">Open above</Button>} />
        <PopoverContent side="top">
          <p className="text-sm">This popover opens above the trigger.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
