import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { FormDatePicker } from "./form-date-picker";

const meta: Meta<typeof FormDatePicker> = {
  title: "Shared/FormDatePicker",
  component: FormDatePicker,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FormDatePicker>;

function ControlledPicker(props: { initial?: string; placeholder?: string; invalid?: boolean; disabled?: boolean }) {
  const [value, setValue] = useState(props.initial ?? "");
  return (
    <FormDatePicker
      value={value}
      onChange={setValue}
      placeholder={props.placeholder}
      disabled={props.disabled}
      aria-invalid={props.invalid}
    />
  );
}

export const Default: Story = {
  render: () => <ControlledPicker />,
};

export const WithValue: Story = {
  render: () => <ControlledPicker initial="2026-06-15" />,
};

export const Invalid: Story = {
  render: () => <ControlledPicker invalid />,
};

export const Disabled: Story = {
  render: () => <ControlledPicker initial="2026-06-15" disabled />,
};
