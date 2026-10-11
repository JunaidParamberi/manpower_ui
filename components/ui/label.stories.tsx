import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta: Meta<typeof Label> = {
  title: "Base/Label",
  component: Label,
  tags: ["autodocs"],
  args: { children: "Label text" },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {};

export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="email">Email address</Label>
      <Input id="email" type="email" placeholder="hello@manpower.app" />
    </div>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="agree" />
      <Label htmlFor="agree">I agree to the terms and conditions</Label>
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="required">
        Client name <span className="text-destructive">*</span>
      </Label>
      <Input id="required" placeholder="Acme Corp" />
    </div>
  ),
};
