import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GradientText } from "./gradient-text";

const meta: Meta<typeof GradientText> = {
  title: "Shared/Ambient/GradientText",
  component: GradientText,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Signature blue -> violet -> rose gradient text treatment, shared by the onboarding-complete loader, auth headlines, and the onboarding page shell. Use for one emphasized phrase per headline, not for body copy.",
      },
    },
  },
  args: { children: "your workspace" },
};
export default meta;
type Story = StoryObj<typeof GradientText>;

export const Default: Story = {
  render: (args) => (
    <p className="font-heading text-3xl font-semibold">
      Building <GradientText {...args} />
    </p>
  ),
};

export const AsHeading: Story = {
  args: { as: "h1", children: "set up your profile" },
  render: (args) => (
    <h1 className="font-heading text-3xl font-semibold">
      Let&rsquo;s <GradientText {...args} />
    </h1>
  ),
};
