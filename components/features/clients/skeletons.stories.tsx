import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ClientNewPageSkeleton,
  ClientDetailSkeleton,
  ClientsListPaneSkeleton,
  ClientsMasterDetailSkeleton,
} from "./skeletons";

/** Loading states for the clients section. Each mirrors the real layout's insets and row geometry so nothing jumps when data arrives. Route loading uses ClientDetailSkeleton (the list pane is real); the master-detail preview is for review only. */
const meta: Meta = {
  title: "Features/Clients/Skeletons",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;

export const ClientsMasterDetail: StoryObj = {
  render: () => <ClientsMasterDetailSkeleton />,
  parameters: { layout: "fullscreen" },
};
export const ClientsListPane: StoryObj = {
  render: () => (
    <div className="flex h-[640px] w-[360px] border border-border bg-[var(--panel)]">
      <ClientsListPaneSkeleton />
    </div>
  ),
};
export const ClientNewPage: StoryObj = { render: () => <ClientNewPageSkeleton /> };
export const ClientDetail: StoryObj = {
  render: () => (
    <div className="@container/shell flex h-[720px] max-w-[960px] bg-[var(--panel)]">
      <ClientDetailSkeleton />
    </div>
  ),
  parameters: { layout: "fullscreen" },
};
