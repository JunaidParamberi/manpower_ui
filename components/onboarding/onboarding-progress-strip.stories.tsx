import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OnboardingProgressStrip } from "./onboarding-progress-strip";

const meta: Meta<typeof OnboardingProgressStrip> = {
  title: "Onboarding/OnboardingProgressStrip",
  component: OnboardingProgressStrip,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OnboardingProgressStrip>;

export const Step1: Story = { args: { step: 1 } };
export const Step2: Story = { args: { step: 2 } };
export const Step3: Story = { args: { step: 3 } };
