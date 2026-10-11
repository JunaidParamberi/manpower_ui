import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Sparkles } from "./sparkles";

const meta: Meta<typeof Sparkles> = {
  title: "Shared/Ambient/Sparkles",
  component: Sparkles,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Drifting twinkle dots in the module palette, ported from the onboarding-complete loader. Returns null when `reduced` is true.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="relative h-[400px] w-full bg-[var(--bg-canvas)]">
        {Story()}
      </div>
    ),
  ],
  args: { reduced: false },
};
export default meta;
type Story = StoryObj<typeof Sparkles>;

export const Default: Story = {};
export const Soft: Story = { args: { density: "soft" } };
export const ReducedMotion: Story = {
  args: { reduced: true },
  parameters: {
    docs: { description: { story: "Renders nothing when reduced motion is requested." } },
  },
};
