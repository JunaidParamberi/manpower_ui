import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MiniBars } from "./mini-bars";

const meta: Meta<typeof MiniBars> = {
  title: "Shared/MiniBars",
  component: MiniBars,
  tags: ["autodocs"],
  args: { values: [3, 5, 2, 8, 4, 6, 7, 5, 9, 6, 4, 8] },
};

export default meta;
type Story = StoryObj<typeof MiniBars>;

export const Default: Story = {};

export const Trending: Story = {
  args: { values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
};

export const Tall: Story = {
  args: { height: 56, barWidth: 6, gap: 3 },
};

export const SuccessColor: Story = {
  args: { color: "var(--success)" },
};

export const DangerColor: Story = {
  args: { color: "var(--danger)" },
};
