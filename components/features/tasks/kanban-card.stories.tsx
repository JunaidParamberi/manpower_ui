import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DndContext } from "@dnd-kit/core";

import type { TaskRow } from "@/types";

import { KanbanCard, KanbanCardStatic } from "./kanban-card";

const baseTask: TaskRow = {
  id: "t1",
  project_id: "p1",
  title: "Design homepage mockup",
  status: "in_progress",
  due_date: "2026-06-05",
  priority: "high",
  labels: ["Design", "UX"],
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
};

const meta: Meta<typeof KanbanCard> = {
  title: "Features/Tasks/KanbanCard",
  component: KanbanCard,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <DndContext>
        <div style={{ width: 280 }}>
          <Story />
        </div>
      </DndContext>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof KanbanCard>;

export const Default: Story = { args: { task: baseTask, onClick: () => {} } };

export const Overdue: Story = {
  args: {
    task: { ...baseTask, due_date: "2026-04-10" },
    onClick: () => {},
  },
};

export const Done: Story = {
  args: {
    task: { ...baseTask, status: "done", title: "Setup repo & CI" },
    onClick: () => {},
  },
};

export const Static: StoryObj = {
  render: () => (
    <div style={{ width: 280 }}>
      <KanbanCardStatic task={baseTask} onClick={() => {}} />
    </div>
  ),
};
