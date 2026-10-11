import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AiIcon } from "./ai-icon";

const meta: Meta<typeof AiIcon> = {
  title: "Shared/AiIcon",
  component: AiIcon,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AiIcon>;

export const Default: Story = {};

export const Large: Story = {
  args: { size: 32 },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3 text-[var(--border-focus)]">
      <AiIcon size={12} />
      <AiIcon size={16} />
      <AiIcon size={24} />
      <AiIcon size={32} />
      <AiIcon size={48} />
    </div>
  ),
};
