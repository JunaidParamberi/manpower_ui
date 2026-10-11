import type { Meta, StoryObj } from "@storybook/react";

import { OnboardingPageShell } from "./onboarding-page-shell";

const meta: Meta<typeof OnboardingPageShell> = {
  title: "Onboarding/OnboardingPageShell",
  component: OnboardingPageShell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full-page, centred, ambient onboarding shell — replaces the split-screen AuthShell + CompanionPanel for onboarding only. Toggle the Storybook a11y 'prefers-reduced-motion' setting to see the ambient backdrop go static.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof OnboardingPageShell>;

const FormPlaceholder = () => (
  <div>
    <div className="mb-4 h-3 w-1/2 rounded-full bg-[var(--bg-subtle)]" />
    <div className="space-y-3">
      <div className="h-11 rounded-lg bg-[var(--bg-subtle)]" />
      <div className="h-11 rounded-lg bg-[var(--bg-subtle)]" />
      <div className="h-11 rounded-lg bg-[var(--bg-subtle)]" />
    </div>
  </div>
);

export const ProfileStep: Story = {
  args: { step: 1, children: <FormPlaceholder /> },
};
export const BrandStep: Story = {
  args: { step: 2, children: <FormPlaceholder /> },
};
export const ClientStep: Story = {
  args: { step: 3, children: <FormPlaceholder /> },
};
