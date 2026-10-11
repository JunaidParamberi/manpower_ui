import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import type { TaskRow } from "@/types";

import { Button } from "@/components/ui/button";

import { TaskEditSheet } from "./task-edit-sheet";

const mockTask: TaskRow = {
  id: "t1a2b3c4-d5e6-7890-abcd-ef1234567890",
  project_id: "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
  title: "Design homepage mockup",
  status: "in_progress",
  due_date: "2026-06-12",
  priority: "high",
  labels: ["Design", "Client"],
  description: "First-pass homepage direction for client review.",
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

const mockSubtask: TaskRow = {
  id: "t2a2b3c4-d5e6-7890-abcd-ef1234567890",
  project_id: "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
  title: "Gather client references",
  status: "done",
  due_date: null,
  priority: "medium",
  labels: [],
  description: null,
  start_date: null,
  completed_at: "2026-05-18T10:00:00Z",
  estimated_minutes: 30,
  sort_order: 0,
  client_visible: false,
  parent_task_id: mockTask.id,
  milestone_id: null,
  created_at: "2026-05-11T09:00:00Z",
  updated_at: "2026-05-18T10:00:00Z",
};

function TaskEditSheetDemo({
  task = mockTask,
  allTasks = [mockTask, mockSubtask],
  createMode = false,
}: {
  task?: TaskRow | null;
  allTasks?: TaskRow[];
  createMode?: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col gap-4">
      <Button type="button" onClick={() => setOpen(true)}>
        Open task modal
      </Button>
      <TaskEditSheet
        task={createMode ? null : task}
        allTasks={allTasks}
        projectId={mockTask.project_id}
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => {}}
        onDeleted={() => setOpen(false)}
        onCreated={() => setOpen(false)}
        defaultStatus="todo"
      />
    </div>
  );
}

const meta: Meta<typeof TaskEditSheetDemo> = {
  title: "Features/Tasks/TaskEditSheet",
  component: TaskEditSheetDemo,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Centered modal for creating or editing a project task — status pills, grouped sections, labels, subtasks, and comments. Used on /tasks and project hubs.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TaskEditSheetDemo>;

export const Default: Story = {};

export const CreateMode: Story = {
  args: {
    createMode: true,
  },
};

export const TodoTask: Story = {
  args: {
    task: { ...mockTask, status: "todo", title: "Prepare kickoff agenda" },
  },
};

export const WithSubtasks: Story = {
  args: {
    allTasks: [
      mockTask,
      mockSubtask,
      {
        ...mockSubtask,
        id: "t3a2b3c4-d5e6-7890-abcd-ef1234567890",
        title: "Draft hero copy",
        status: "todo",
        completed_at: null,
      },
    ],
  },
};
