import type { Meta, StoryObj } from "@storybook/react";
import { AuthShell } from "./auth-shell";

const meta: Meta<typeof AuthShell> = {
  title: "Auth/AuthShell",
  component: AuthShell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Single-column, centered auth shell. Header and footer are pinned full-width; only the card body scrolls if content overflows. A default-density ambient wash sits behind the centered card, with a brand-gradient hairline above it (desktop). On mobile the card chrome drops to a full-width, edge-to-edge form. Use for all auth routes (onboarding uses OnboardingPageShell instead).",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof AuthShell>;

const Tall = () => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: 20 }).map((_, i) => (
      <div key={i} className="h-12 rounded-xl bg-[var(--bg-subtle)]" />
    ))}
  </div>
);

export const ShortForm: Story = {
  args: { children: <div className="h-40 rounded-xl bg-[var(--bg-subtle)]" /> },
};
export const TallFormScrolls: Story = {
  args: { children: <Tall /> },
};
