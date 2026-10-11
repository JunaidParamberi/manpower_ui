import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { TaskListRow } from "@/types";

import { TasksKanbanBoard } from "./tasks-kanban-board";

const tasks: TaskListRow[] = [
  {
    id: "t1",
    project_id: "p1",
    title: "Client kickoff deck",
    status: "todo",
    due_date: "2026-06-12",
    priority: "high",
    labels: ["Client"],
    description: "Prepare a concise agenda and onboarding deck.",
    start_date: null,
    completed_at: null,
    estimated_minutes: 90,
    sort_order: 0,
    client_visible: true,
    parent_task_id: null,
    milestone_id: null,
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-01T10:00:00Z",
    project: {
      id: "p1",
      title: "Brand Sprint",
      client: {
        id: "c1",
        name: "Aurora Coffee",
      },
    },
  },
  {
    id: "t2",
    project_id: "p2",
    title: "Invoice implementation QA",
    status: "in_progress",
    due_date: "2026-06-15",
    priority: "medium",
    labels: ["QA"],
    description: null,
    start_date: "2026-06-08",
    completed_at: null,
    estimated_minutes: 45,
    sort_order: 0,
    client_visible: false,
    parent_task_id: null,
    milestone_id: null,
    created_at: "2026-06-02T10:00:00Z",
    updated_at: "2026-06-02T10:00:00Z",
    project: {
      id: "p2",
      title: "Finance Portal",
      client: {
        id: "c2",
        name: "Northstar Studio",
      },
    },
  },
  {
    id: "t3",
    project_id: "p1",
    title: "Publish approved homepage",
    status: "done",
    due_date: "2026-06-05",
    priority: "low",
    labels: [],
    description: null,
    start_date: null,
    completed_at: "2026-06-05T14:00:00Z",
    estimated_minutes: null,
    sort_order: 1,
    client_visible: true,
    parent_task_id: null,
    milestone_id: null,
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-05T14:00:00Z",
    project: {
      id: "p1",
      title: "Brand Sprint",
      client: {
        id: "c1",
        name: "Aurora Coffee",
      },
    },
  },
];

const meta: Meta<typeof TasksKanbanBoard> = {
  title: "Features/Tasks/TasksKanbanBoard",
  component: TasksKanbanBoard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A global task inbox board that groups top-level tasks by status across projects. Use it on the /tasks route for cross-project planning, not inside a single project workspace.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TasksKanbanBoard>;

export const Default: Story = {
  args: {
    tasks,
    allTasks: tasks,
    onAddTask: () => {},
  },
};

export const Empty: Story = {
  args: {
    tasks: [],
    allTasks: [],
    onAddTask: () => {},
  },
};
