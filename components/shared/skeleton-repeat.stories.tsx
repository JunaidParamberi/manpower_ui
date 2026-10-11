import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SkeletonRepeat } from "./skeleton-repeat";
import { Skeleton } from "./skeletons";

const meta: Meta<typeof SkeletonRepeat> = {
  title: "Shared/SkeletonRepeat",
  component: SkeletonRepeat,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex w-80 flex-col gap-3">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SkeletonRepeat>;

export const Default: Story = {
  args: {
    count: 5,
    render: (i) => <Skeleton key={i} h={16} />,
  },
};

export const Zero: Story = {
  args: {
    count: 0,
    render: (i) => <Skeleton key={i} h={16} />,
  },
};

export const ManyRows: Story = {
  args: {
    count: 10,
    render: (i) => <Skeleton key={i} h={12} w={`${60 + (i % 4) * 10}%`} />,
  },
};
