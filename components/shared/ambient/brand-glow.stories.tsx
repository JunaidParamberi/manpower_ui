import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BrandGlow } from "./brand-glow";

const meta: Meta<typeof BrandGlow> = {
  title: "Shared/Ambient/BrandGlow",
  component: BrandGlow,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Calm, single-colour brand wash for the auth and onboarding shells. A subtle brand-blue glow derived from the `--accent` token (so it tracks light/dark themes), balanced top and bottom. Use it as the quiet atmosphere behind a centred card. Prefer this over the multicolour AmbientBackdrop when the surface should read as branded but restrained; reach for AmbientBackdrop only when you genuinely want the richer aurora.",
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
};
export default meta;
type Story = StoryObj<typeof BrandGlow>;

export const Default: Story = {};

export const BehindCard: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "How it appears in the shells: a centred surface sitting on the brand wash.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="relative grid h-[500px] w-full place-items-center overflow-hidden bg-[var(--bg-canvas)]">
        {Story()}
        <div className="relative z-10 w-full max-w-[360px] rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)]/80 p-8 text-center text-sm text-[var(--fg-2)] shadow-[var(--shadow-lg)] backdrop-blur-xl">
          Welcome back
        </div>
      </div>
    ),
  ],
};
