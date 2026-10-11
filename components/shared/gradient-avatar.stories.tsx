import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GradientAvatar } from "./gradient-avatar";

const meta: Meta<typeof GradientAvatar> = {
  title: "Shared/GradientAvatar",
  component: GradientAvatar,
  tags: ["autodocs"],
  args: { name: "Acme Design" },
};

export default meta;
type Story = StoryObj<typeof GradientAvatar>;

export const Default: Story = {};

export const WithName: Story = {
  args: { name: "Zenith Studio" },
};

export const Large: Story = {
  args: { size: 64 },
};

export const Small: Story = {
  args: { size: 20 },
};

export const Group: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      {["Acme Design", "Zenith Studio", "Pixel Forge", "Studio Vert", "Northwind", "BrightLab"].map(
        (n) => (
          <GradientAvatar key={n} name={n} size={40} />
        ),
      )}
    </div>
  ),
};
