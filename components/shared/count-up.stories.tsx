import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CountUp } from "./count-up";

const meta: Meta<typeof CountUp> = {
  title: "Shared/CountUp",
  component: CountUp,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="text-3xl font-semibold tabular-nums">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CountUp>;

export const Default: Story = {
  args: { value: 1234 },
};

export const LargeNumber: Story = {
  args: { value: 987654 },
};

export const Currency: Story = {
  args: { value: 42500, format: "currency", currency: "AED" },
};

export const SlowDuration: Story = {
  args: { value: 500, duration: 2000 },
};
