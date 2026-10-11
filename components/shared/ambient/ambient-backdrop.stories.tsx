import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AmbientBackdrop } from "./ambient-backdrop";

const meta: Meta<typeof AmbientBackdrop> = {
  title: "Shared/Ambient/AmbientBackdrop",
  component: AmbientBackdrop,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Composed Aurora + GridNoise + Sparkles wash — the single drop-in atmosphere layer used by the auth shell, companion panel, and onboarding page shell.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="relative h-[500px] w-full overflow-hidden bg-[var(--bg-canvas)]">
        {Story()}
      </div>
    ),
  ],
  args: { reduced: false },
};
export default meta;
type Story = StoryObj<typeof AmbientBackdrop>;

export const DefaultDensity: Story = {};
export const SoftDensity: Story = {
  args: { density: "soft" },
  parameters: {
    docs: {
      description: {
        story: "Used behind real form content (e.g. the auth form column) where legibility outweighs spectacle.",
      },
    },
  },
};
export const ReducedMotion: Story = { args: { reduced: true } };
