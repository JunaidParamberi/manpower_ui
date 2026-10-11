import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonKPI,
  SkeletonChart,
  SkeletonListRow,
  SkeletonList,
  SkeletonTableRow,
  SkeletonTable,
  SkeletonCard,
} from "./skeletons";

const meta: Meta = {
  title: "Shared/Skeletons",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <Skeleton h={16} />
      <Skeleton w="70%" h={16} />
      <Skeleton w="40%" h={16} />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <Skeleton variant="text" />
      <Skeleton variant="textLg" />
      <Skeleton variant="block" />
      <div className="flex items-center gap-2">
        <Skeleton variant="circle" h={28} />
        <Skeleton variant="circle" h={40} />
        <Skeleton variant="circle" h={56} />
      </div>
    </div>
  ),
};

export const Pulse: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <Skeleton h={16} pulse />
      <Skeleton w="70%" h={16} pulse />
    </div>
  ),
};

export const Text: Story = {
  render: () => (
    <div className="w-96">
      <SkeletonText />
    </div>
  ),
};

export const Avatar: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <SkeletonAvatar size={20} />
      <SkeletonAvatar size={28} />
      <SkeletonAvatar size={40} />
      <SkeletonAvatar size={56} />
    </div>
  ),
};

export const KPI: Story = {
  render: () => (
    <div className="grid w-[640px] grid-cols-2 gap-3">
      <SkeletonKPI />
      <SkeletonKPI />
      <SkeletonKPI />
      <SkeletonKPI />
    </div>
  ),
};

export const Chart: Story = {
  render: () => (
    <div className="w-[640px]">
      <SkeletonChart />
    </div>
  ),
};

export const ListRow: Story = {
  render: () => (
    <div className="w-[480px] rounded-lg border border-border bg-card">
      <SkeletonListRow />
    </div>
  ),
};

export const List: Story = {
  render: () => (
    <div className="w-[480px] rounded-lg border border-border bg-card">
      <SkeletonList count={6} withAvatar />
    </div>
  ),
};

export const TableRow: Story = {
  render: () => (
    <table className="w-[640px] text-sm">
      <tbody>
        <SkeletonTableRow />
      </tbody>
    </table>
  ),
};

export const Table: Story = {
  render: () => (
    <div className="w-[720px]">
      <SkeletonTable rows={6} cols={5} headers={["Client", "Project", "Status", "Amount", "Due"]} />
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <div className="w-[420px]">
      <SkeletonCard />
    </div>
  ),
};
