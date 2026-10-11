import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProjectPeek } from "./project-peek";

/**
 * Side panel over the Board or Timeline that shows one project's workspace
 * without leaving the view. Esc or a click outside closes it; "Open page"
 * goes to the full project page. Use on Board and Timeline only — the List
 * view shows the workspace inline instead.
 */
const meta: Meta<typeof ProjectPeek> = {
  title: "Features/Projects/ProjectPeek",
  component: ProjectPeek,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="relative h-[600px] overflow-hidden bg-[var(--panel)] p-6 text-meta text-[var(--fg-3)]">
        Board behind the panel
        <Story />
      </div>
    ),
  ],
  args: {
    open: true,
    title: "Brand refresh",
    href: "/projects/p3",
    onClose: () => {},
    children: (
      <div className="flex flex-col gap-3">
        <div className="h-6 w-2/3 rounded-md bg-[var(--bg-subtle)]" />
        <div className="h-36 rounded-xl border border-border bg-card" />
        <div className="h-48 rounded-xl border border-border bg-card" />
      </div>
    ),
  },
};
export default meta;
type Story = StoryObj<typeof ProjectPeek>;

export const Open: Story = {};
export const Closed: Story = { args: { open: false } };
export const LongTitle: Story = { args: { title: "Photo shoot, spring line for Al Noor Hospitality & Events Management Group" } };
