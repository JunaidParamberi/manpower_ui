import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { RegionSelect } from "./region-select";

const meta: Meta<typeof RegionSelect> = {
  title: "Onboarding/RegionSelect",
  component: RegionSelect,
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
type Story = StoryObj<typeof RegionSelect>;

export const UAE: Story = {
  render: () => {
    const Wrap = () => {
      const [value, setValue] = useState("");
      return <RegionSelect countryCode="AE" value={value} onChange={setValue} />;
    };
    return <Wrap />;
  },
};

export const India: Story = {
  render: () => {
    const Wrap = () => {
      const [value, setValue] = useState("");
      return <RegionSelect countryCode="IN" value={value} onChange={setValue} />;
    };
    return <Wrap />;
  },
};

export const FreeTextFallback: Story = {
  render: () => {
    const Wrap = () => {
      const [value, setValue] = useState("");
      return <RegionSelect countryCode="DE" value={value} onChange={setValue} />;
    };
    return <Wrap />;
  },
};
