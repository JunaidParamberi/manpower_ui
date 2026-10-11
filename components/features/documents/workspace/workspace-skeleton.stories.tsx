import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WorkspaceSkeleton } from "./workspace-skeleton";

/**
 * Loading state of a document page: header, paper and settings rail. Shown while a document loads.
 * Not for lists: use the list skeletons.
 */
const meta: Meta<typeof WorkspaceSkeleton> = {
  title: "Features/Documents/Workspace/WorkspaceSkeleton",
  component: WorkspaceSkeleton,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="flex h-[720px] flex-col bg-[var(--panel)]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof WorkspaceSkeleton>;

export const Default: Story = {};
export const WithoutRail: Story = { args: { withRail: false } };
export const Narrow: Story = { decorators: [(Story) => <div className="max-w-[390px]"><Story /></div>] };
