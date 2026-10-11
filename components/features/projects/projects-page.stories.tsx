import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AiPanelProvider } from "@/lib/ai-panel/context";
import { FIXTURE_TODAY, PORTFOLIO_FIXTURE } from "./portfolio-fixtures";
import { ProjectsPage } from "./projects-page";

/**
 * The projects page: lenses with counts, search and a List / Board /
 * Timeline switch over one portfolio. The selected project's workspace shows
 * beside the list or in a side panel over the board and timeline. Workspace
 * data comes from the server page; these stories show the portfolio without
 * it (the list falls back to "Pick a project").
 */
const meta: Meta<typeof ProjectsPage> = {
  title: "Features/Projects/ProjectsPage",
  component: ProjectsPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <AiPanelProvider>
        <div className="h-[820px] bg-[var(--panel)]">
          <Story />
        </div>
      </AiPanelProvider>
    ),
  ],
  args: {
    projects: PORTFOLIO_FIXTURE,
    today: FIXTURE_TODAY,
    view: "list",
    lens: "all",
    query: "",
    zoom: 6,
    selectedId: null,
    invalidSelection: false,
    workspace: null,
    currency: "AED",
    userDisplayName: "Layla",
    initialTaskViewMode: "list",
    initialTimelineView: "milestones",
    activeTab: "tasks",
  },
};
export default meta;
type Story = StoryObj<typeof ProjectsPage>;

export const ListView: Story = {};
export const BoardView: Story = { args: { view: "board" } };
export const TimelineView: Story = { args: { view: "timeline" } };
export const NeedsYouLens: Story = { args: { lens: "needs_you" } };
export const EmptyLens: Story = { args: { lens: "done", query: "zzz" } };
export const StaleLink: Story = { args: { invalidSelection: true } };
