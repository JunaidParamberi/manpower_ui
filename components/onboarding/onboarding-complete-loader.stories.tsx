import type { Meta, StoryObj } from "@storybook/react";
import { OnboardingCompleteLoader } from "./onboarding-complete-loader";

/**
 * Full-screen "setup ceremony" shown after onboarding completes and before the
 * dashboard renders. Instead of a blank flash, the user watches a colourful mock
 * dashboard build itself — revenue counts up, a paid-ring sweeps, client avatars
 * pop in, a sparkline draws and bars grow — while a personalized checklist ticks
 * each setup step on a ~3.5s timeline. Activity "pings" drift in around the edges
 * and confetti celebrates when it lands.
 *
 * Use when handing off from a multi-step flow to a data-heavy destination and you
 * want the wait to feel intentional. Do NOT use it as a generic page spinner — it
 * is theatrical by design and adds a minimum display time.
 *
 * The live component runs its own ticker. These stories pass `frozenElapsedMs` to
 * freeze the timeline at a chosen moment so each visual state is stable.
 */
const meta: Meta<typeof OnboardingCompleteLoader> = {
  title: "Onboarding/CompleteLoader",
  component: OnboardingCompleteLoader,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full-screen, branded setup ceremony shown after onboarding completes. A colourful dashboard assembles tile-by-tile while a personalized checklist ticks through workspace setup on a ~3.5s timeline, then navigation fires.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof OnboardingCompleteLoader>;

/** Live ceremony — runs the real ticker end to end. */
export const Default: Story = {
  args: { clientName: "Acme Studio" },
};

/** Skip path: no client was added, so the step uses a generic label. */
export const NoClientName: Story = {
  args: { frozenElapsedMs: 800 },
};

/** Frozen near the start — first step active, dashboard still mostly empty. */
export const Starting: Story = {
  args: { clientName: "Acme Studio", frozenElapsedMs: 200 },
};

/** Frozen mid-progress — a couple of steps done, tiles filling in. */
export const MidProgress: Story = {
  args: { clientName: "Acme Studio", frozenElapsedMs: 1800 },
};

/** Frozen at the celebratory finish — dashboard fully assembled, confetti falling. */
export const Celebrating: Story = {
  args: { clientName: "Acme Studio", frozenElapsedMs: 3600 },
};

/**
 * Reduced-motion users: animations collapse to instant state changes (no spring,
 * no pulse), steps still tick. Toggle the Storybook "prefers-reduced-motion" a11y
 * setting to see the live difference.
 */
export const ReducedMotion: Story = {
  args: { clientName: "Acme Studio", frozenElapsedMs: 1800 },
  parameters: {
    docs: {
      description: {
        story:
          "Honors `prefers-reduced-motion`: spring/pulse animations are disabled and tiles/checks appear instantly while the timeline still advances.",
      },
    },
  },
};
