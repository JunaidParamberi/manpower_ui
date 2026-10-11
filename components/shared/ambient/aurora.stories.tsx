import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Aurora } from "./aurora";

const meta: Meta<typeof Aurora> = {
  title: "Shared/Ambient/Aurora",
  component: Aurora,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Drifting blurred colour blobs ported from the onboarding-complete loader. Always render behind real content with z-index, never as the only layer.",
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
type Story = StoryObj<typeof Aurora>;

export const Default: Story = {};
export const Soft: Story = { args: { density: "soft" } };
export const ReducedMotion: Story = { args: { reduced: true } };
