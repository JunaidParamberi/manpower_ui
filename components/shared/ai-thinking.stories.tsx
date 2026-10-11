import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AIThinking } from "./ai-thinking";

const meta: Meta<typeof AIThinking> = {
  title: "Shared/AIThinking",
  component: AIThinking,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AIThinking>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: { label: "Drafting invoice…" },
};

export const Large: Story = {
  args: { label: "Analyzing", size: 24 },
};
