import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FIXTURE_TODAY, PACED_FIXTURE } from "./portfolio-fixtures";
import { ProjectsTimelineView } from "./projects-timeline-view";

/**
 * Portfolio timeline for planning: every project as a bar from start to
 * deadline, filled by work done, with milestones and a Today line. Drag a
 * bar to move it, drag an end to change one date; Enter opens the side
 * panel and Alt + arrow keys move a bar by a day. Projects without a
 * deadline are listed under "No dates".
 */
const meta: Meta<typeof ProjectsTimelineView> = {
  title: "Features/Projects/ProjectsTimelineView",
  component: ProjectsTimelineView,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="flex h-[720px] bg-[var(--panel)]"><Story /></div>],
  args: { projects: PACED_FIXTURE, today: FIXTURE_TODAY, zoom: 6, onZoom: () => {}, onOpen: () => {}, onReschedule: () => {} },
};
export default meta;
type Story = StoryObj<typeof ProjectsTimelineView>;

export const Default: Story = {};
export const ThreeMonths: Story = { args: { zoom: 3 } };
export const TwelveMonths: Story = { args: { zoom: 12 } };
export const Empty: Story = { args: { projects: [] } };
