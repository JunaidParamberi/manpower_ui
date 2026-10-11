import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { filterPortfolio } from "@/lib/projects/portfolio-filters";
import { PACED_FIXTURE } from "./portfolio-fixtures";
import { ProjectsListPane } from "./projects-list-view";

/**
 * The list block body on the projects page: projects grouped by what needs
 * you, with sticky group headings. Use for day-to-day work;
 * use the Board for pipeline overview and the Timeline for planning.
 */
const meta: Meta<typeof ProjectsListPane> = {
  title: "Features/Projects/ProjectsListPane",
  component: ProjectsListPane,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="flex h-[720px] w-[340px] flex-col rounded-2xl border border-border bg-[var(--panel)]"><Story /></div>],
  args: {
    projects: PACED_FIXTURE,
    selectedId: "p1",
    onSelect: () => {},
    emptyMessage: "Nothing here yet.",
  },
};
export default meta;
type Story = StoryObj<typeof ProjectsListPane>;

export const Default: Story = {};
export const NeedsYouOnly: Story = { args: { projects: filterPortfolio(PACED_FIXTURE, "needs_you", "") } };
export const LongNames: Story = { args: { selectedId: "p8" } };
export const Empty: Story = { args: { projects: [], selectedId: null } };
