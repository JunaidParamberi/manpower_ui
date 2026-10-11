import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PACED_FIXTURE } from "./portfolio-fixtures";
import { ProjectsBoardView } from "./projects-board-view";

/**
 * Portfolio Kanban. Drag a card between Planning, Active, On hold and
 * Completed to change its status; click a card to open its side panel; tick
 * the next task right on the card. Use for a pipeline overview; long task
 * work belongs in the List view's workspace.
 */
const meta: Meta<typeof ProjectsBoardView> = {
  title: "Features/Projects/ProjectsBoardView",
  component: ProjectsBoardView,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="flex h-[720px] bg-[var(--panel)]"><Story /></div>],
  args: { projects: PACED_FIXTURE, currency: "AED", onOpen: () => {}, onMove: () => {}, onCompleteTask: () => {} },
};
export default meta;
type Story = StoryObj<typeof ProjectsBoardView>;

export const Default: Story = {};
export const LongNames: Story = { args: { projects: PACED_FIXTURE.filter((p) => p.status === "planning") } };
export const Empty: Story = { args: { projects: [] } };
