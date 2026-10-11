import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { TaskRow } from "@/types";
import { ProjectTaskChecklist } from "./project-task-checklist";

function task(id: string, title: string, over: Partial<TaskRow> = {}): TaskRow {
  return {
    id,
    project_id: "p1",
    user_id: "u1",
    title,
    status: "todo",
    priority: "medium",
    due_date: null,
    sort_order: 0,
    parent_task_id: null,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    ...over,
  } as TaskRow;
}

/**
 * Compact task list for the projects page workspace: tick to complete, type
 * to add, done tasks folded away. Use on the projects page; the project page
 * keeps the full task board with statuses, priorities and filters.
 */
const meta: Meta<typeof ProjectTaskChecklist> = {
  title: "Features/Projects/ProjectTaskChecklist",
  component: ProjectTaskChecklist,
  tags: ["autodocs"],
  parameters: { layout: "padded", nextjs: { appDirectory: true } },
  decorators: [(Story) => <div className="max-w-[640px]"><Story /></div>],
  args: {
    projectId: "p1",
    today: "2026-10-08",
    tasks: [
      task("t1", "Final logo concepts, round 1", { due_date: "2026-10-01" }),
      task("t2", "Moodboard sign-off", { due_date: "2026-10-12" }),
      task("t3", "Brand guidelines PDF"),
      task("t4", "Kick-off call", { status: "done" }),
    ],
  },
};
export default meta;
type Story = StoryObj<typeof ProjectTaskChecklist>;

export const Default: Story = {};
export const AllDone: Story = { args: { tasks: [task("t4", "Kick-off call", { status: "done" })] } };
export const Empty: Story = { args: { tasks: [] } };
