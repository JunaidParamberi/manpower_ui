import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { TaskListRow } from "@/types";

import { Table, TableBody } from "@/components/ui/table";

import { TaskRow } from "./task-row";

const baseProject = {
  id: "p1",
  title: "Brand Refresh 2026",
  client: { id: "c1", name: "Acme Design Co." },
};

const baseTask: TaskListRow = {
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
  project: baseProject,
};

const meta: Meta<typeof TaskRow> = {
  title: "Features/Tasks/TaskRow",
  component: TaskRow,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <Table>
        <TableBody>
          <Story />
        </TableBody>
      </Table>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TaskRow>;

export const Default: Story = { args: { task: baseTask } };

export const Done: Story = {
  args: { task: { ...baseTask, status: "done", title: "Setup repo & CI" } },
};

export const Overdue: Story = {
  args: {
    task: {
      ...baseTask,
      due_date: "2026-04-10",
      title: "Send invoice to Acme",
      priority: "high",
    },
  },
};

export const LowPriority: Story = {
  args: {
    task: {
      ...baseTask,
      priority: "low",
      status: "todo",
      title: "Polish landing CTA copy",
    },
  },
};
