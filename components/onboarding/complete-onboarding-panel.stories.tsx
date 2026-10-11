import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CompleteOnboardingPanel } from "./complete-onboarding-panel";

const meta: Meta<typeof CompleteOnboardingPanel> = {
  title: "Onboarding/CompleteOnboardingPanel",
  component: CompleteOnboardingPanel,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[680px] max-w-[calc(100vw-2rem)] rounded-[2rem] border bg-background p-8 shadow-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CompleteOnboardingPanel>;

export const Default: Story = {};
