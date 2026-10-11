import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { FormTimeSelect } from "./form-time-select";

const meta: Meta<typeof FormTimeSelect> = {
  title: "Shared/FormTimeSelect",
  component: FormTimeSelect,
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
type Story = StoryObj<typeof FormTimeSelect>;

function Controlled(props: { initial?: string; variant?: "24h" | "12h"; disabled?: boolean }) {
  const [value, setValue] = useState(props.initial ?? "");
  return (
    <FormTimeSelect
      value={value}
      onChange={setValue}
      variant={props.variant}
      disabled={props.disabled}
    />
  );
}

export const Default: Story = {
  render: () => <Controlled />,
};

export const TwelveHour: Story = {
  render: () => <Controlled variant="12h" initial="14:30" />,
};

export const TwentyFourHour: Story = {
  render: () => <Controlled variant="24h" initial="14:30" />,
};

export const Disabled: Story = {
  render: () => <Controlled initial="09:00" disabled />,
};
