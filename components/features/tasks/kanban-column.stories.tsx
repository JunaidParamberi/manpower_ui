import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DndContext } from "@dnd-kit/core";

import type { TaskRow } from "@/types";

import { KanbanColumn } from "./kanban-column";

const tasks: TaskRow[] = [
  {
    id: "t1",
    project_id: "p1",
    title: "Design homepage mockup",
    status: "in_progress",
    due_date: "2026-06-05",
    priority: "high",
    labels: ["Design"],
    description: "Create the first-pass homepage design direction.",
    start_date: "2026-06-01",
    completed_at: null,
    estimated_minutes: 180,
    sort_order: 0,
    client_visible: true,
    parent_task_id: null,
    milestone_id: null,
    created_at: "2026-05-10T09:00:00Z",
    updated_at: "2026-05-22T16:00:00Z",
  },
  {
    id: "t2",
    project_id: "p1",
    title: "Review brand guidelines",
    status: "in_progress",
    due_date: null,
    priority: "medium",
    labels: [],
    description: null,
    start_date: null,
    completed_at: null,
    estimated_minutes: null,
    sort_order: 1,
    client_visible: false,
    parent_task_id: null,
    milestone_id: null,
    created_at: "2026-05-12T11:00:00Z",
    updated_at: "2026-05-12T11:00:00Z",
  },
];

const meta: Meta<typeof KanbanColumn> = {
  title: "Features/Tasks/KanbanColumn",
  component: KanbanColumn,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <DndContext>
        <div style={{ width: 320 }}>
          <Story />
        </div>
      </DndContext>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof KanbanColumn>;

export const Default: Story = {
  args: {
    status: "in_progress",
    label: "In progress",
    dotClass: "status-dot--active",
    tasks,
    onCardClick: () => {},
    onAddTask: () => {},
  },
};

export const Empty: Story = {
  args: {
    status: "todo",
    label: "To do",
    dotClass: "status-dot--planning",
    tasks: [],
    onCardClick: () => {},
    onAddTask: () => {},
  },
};
