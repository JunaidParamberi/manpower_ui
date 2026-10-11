import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DashboardPageSkeleton, ProtectedPlaceholderSkeleton } from "./skeletons";

const meta: Meta<typeof DashboardPageSkeleton> = {
  title: "Features/Dashboard/Skeletons",
  component: DashboardPageSkeleton,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof DashboardPageSkeleton>;

export const DashboardPage: Story = {};

export const ProtectedPlaceholder: StoryObj = {
  render: () => <ProtectedPlaceholderSkeleton />,
};