import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { CountryCombobox } from "./country-combobox";

const meta: Meta<typeof CountryCombobox> = {
  title: "Onboarding/CountryCombobox",
  component: CountryCombobox,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CountryCombobox>;

export const Empty: Story = {
  render: () => {
    const Wrap = () => {
      const [value, setValue] = useState("");
      return <CountryCombobox value={value} onChange={setValue} />;
    };
    return <Wrap />;
  },
};

export const Preselected: Story = {
  render: () => {
    const Wrap = () => {
      const [value, setValue] = useState("AE");
      return <CountryCombobox value={value} onChange={setValue} />;
    };
    return <Wrap />;
  },
};

export const Invalid: Story = {
  render: () => {
    const Wrap = () => {
      const [value, setValue] = useState("");
      return <CountryCombobox value={value} onChange={setValue} aria-invalid />;
    };
    return <Wrap />;
  },
};
