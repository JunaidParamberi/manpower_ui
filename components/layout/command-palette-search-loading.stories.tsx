import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CommandPaletteSearchLoading } from "./command-palette-search-loading";

const meta: Meta<typeof CommandPaletteSearchLoading> = {
  title: "Layout/CommandPaletteSearchLoading",
  component: CommandPaletteSearchLoading,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div className="w-[min(100%,640px)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CommandPaletteSearchLoading>;

export const Default: Story = {};
