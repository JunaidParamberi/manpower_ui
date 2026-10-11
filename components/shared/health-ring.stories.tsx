import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HealthRing } from "./health-ring";

const meta: Meta<typeof HealthRing> = {
  title: "Shared/HealthRing",
  component: HealthRing,
  tags: ["autodocs"],
  args: { score: 85 },
};

export default meta;
type Story = StoryObj<typeof HealthRing>;

export const Good: Story = { args: { score: 92 } };
export const Medium: Story = { args: { score: 68 } };
export const Poor: Story = { args: { score: 35 } };
export const Unset: Story = { args: { score: null } };

export const Large: Story = {
  args: { score: 78, size: 64, strokeWidth: 5 },
};

export const Scale: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <HealthRing score={95} />
      <HealthRing score={75} />
      <HealthRing score={50} />
      <HealthRing score={20} />
      <HealthRing score={null} />
    </div>
  ),
};
