import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { FormTimePopover } from "./form-time-popover";

const meta: Meta<typeof FormTimePopover> = {
  title: "Shared/FormTimePopover",
  component: FormTimePopover,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FormTimePopover>;

function ControlledPopover(props: { initial?: string; invalid?: boolean; disabled?: boolean }) {
  const [value, setValue] = useState(props.initial ?? "");
  return (
    <FormTimePopover
      value={value}
      onChange={setValue}
      disabled={props.disabled}
      aria-invalid={props.invalid}
    />
  );
}

export const Default: Story = {
  render: () => <ControlledPopover />,
};

export const WithValue: Story = {
  render: () => <ControlledPopover initial="14:30" />,
};

export const Invalid: Story = {
  render: () => <ControlledPopover invalid />,
};

export const Disabled: Story = {
  render: () => <ControlledPopover initial="09:00" disabled />,
};
