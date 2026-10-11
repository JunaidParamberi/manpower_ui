import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { TaskListRow } from "@/types";

import { TasksSummaryStrip } from "./tasks-summary-strip";

const baseProject = {
  id: "p1",
  title: "Brand Refresh 2026",
  client: { id: "c1", name: "Acme Design Co." },
};

function task(
  id: string,
  status: TaskListRow["status"],
  due: string | null,
  priority: TaskListRow["priority"] = "medium",
): TaskListRow {
  return {
    id,
    project_id: "p1",
    title: `Task ${id}`,
    status,
    due_date: due,
    priority,
    labels: [],
    description: null,
    start_date: null,
    completed_at: null,
    estimated_minutes: null,
    sort_order: 0,
    client_visible: false,
    parent_task_id: null,
    milestone_id: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-20T10:00:00Z",
    project: baseProject,
  };
}

const today = new Date().toISOString().slice(0, 10);

const tasks: TaskListRow[] = [
  task("1", "todo", today),
  task("2", "in_progress", "2026-06-10"),
  task("3", "todo", "2026-01-10"),
  task("4", "done", "2026-05-20"),
  task("5", "done", "2026-05-22"),
];

const meta: Meta<typeof TasksSummaryStrip> = {
  title: "Features/Tasks/TasksSummaryStrip",
  component: TasksSummaryStrip,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof TasksSummaryStrip>;

export const Default: Story = {
  args: {
    tasks,
    filters: {
      project: "all",
      status: "all",
      priority: "all",
      sort: "due",
      view: "open",
    },
  },
};

export const Empty: Story = {
  args: {
    tasks: [],
    filters: {
      project: "all",
      status: "all",
      priority: "all",
      sort: "due",
      view: "open",
    },
  },
};
