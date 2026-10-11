"use client";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A binary on/off toggle built on Radix Switch. Use for instant-apply settings that take effect immediately when flipped (e.g. enabling TDS deduction, toggling email notifications). Do not use for form fields that are submitted with a Save button or for multi-select lists — use Checkbox for those.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {};

export const Checked: Story = {
  render: () => <Switch defaultChecked />,
};

export const Disabled: Story = {
  render: () => <Switch disabled />,
};

export const DisabledChecked: Story = {
  render: () => <Switch disabled defaultChecked />,
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="tds" />
      <Label htmlFor="tds">Enable TDS deduction</Label>
    </div>
  ),
};
