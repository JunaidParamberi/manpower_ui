import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton } from "./skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Base/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  render: () => <Skeleton className="h-4 w-48" />,
};

export const Circle: Story = {
  render: () => <Skeleton className="size-10 rounded-full" />,
};

export const Card: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-64 rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-full" />
        <div className="flex flex-col gap-1.5 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-4/6" />
    </div>
  ),
};

export const TableRows: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-full max-w-md">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20 ms-auto" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  ),
};

export const KpiCards: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl border p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  ),
};
