"use client";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as React from "react";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta: Meta<typeof Checkbox> = {
  title: "Base/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};

export const Checked: Story = {
  render: () => <Checkbox defaultChecked />,
};

export const Disabled: Story = {
  render: () => <Checkbox disabled />,
};

export const DisabledChecked: Story = {
  render: () => <Checkbox disabled defaultChecked />,
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

function CheckboxListDemo() {
  const [checked, setChecked] = React.useState<string[]>(["email"]);
  const options = [
    { id: "email", label: "Email notifications" },
    { id: "sms", label: "SMS notifications" },
    { id: "push", label: "Push notifications" },
  ];

  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => (
        <div key={opt.id} className="flex items-center gap-2">
          <Checkbox
            id={opt.id}
            checked={checked.includes(opt.id)}
            onCheckedChange={(val) =>
              setChecked((prev) =>
                val ? [...prev, opt.id] : prev.filter((x) => x !== opt.id)
              )
            }
          />
          <Label htmlFor={opt.id}>{opt.label}</Label>
        </div>
      ))}
    </div>
  );
}

export const CheckboxList: Story = {
  render: () => <CheckboxListDemo />,
};
