import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GridNoise } from "./grid-noise";

const meta: Meta<typeof GridNoise> = {
  title: "Shared/Ambient/GridNoise",
  component: GridNoise,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="relative h-[300px] w-full bg-[var(--bg-canvas)]">
        {Story()}
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof GridNoise>;

export const Default: Story = {};
