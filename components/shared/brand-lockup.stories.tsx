import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BrandLockup, BrandLockupLink } from "./brand-lockup";

const meta: Meta<typeof BrandLockup> = {
  title: "Shared/BrandLockup",
  component: BrandLockup,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BrandLockup>;

export const Default: Story = {};

export const ForceDarkWordmark: Story = {
  args: { forceDarkWordmark: true },
  decorators: [
    (Story) => (
      <div style={{ background: "#0b1020", padding: 24, borderRadius: 12 }}>
        <Story />
      </div>
    ),
  ],
};

export const AsLink: Story = {
  render: () => <BrandLockupLink href="#" />,
};
