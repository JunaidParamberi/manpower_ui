import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ProjectListRow, ProjectMilestoneRow, TaskRow } from "@/types";

import { ProjectSummaryCard } from "./project-summary-card";

const baseProject: ProjectListRow = {
  id: "p1",
  user_id: "u1",
  client_id: "c1",
  title: "Brand Refresh 2026",
  status: "active",
  budget: 15000,
  spent: 4200,
  hourly_rate: null,
  start_date: "2026-04-01",
  deadline: "2026-06-30",
  created_at: "2026-04-01T09:00:00Z",
  updated_at: "2026-05-20T16:00:00Z",
  client: { id: "c1", name: "Acme Design Co." },
} as ProjectListRow;

const milestones: ProjectMilestoneRow[] = [
  {
    id: "m1",
    project_id: "p1",
    title: "Design approval",
    description: null,
    status: "completed",
    due_date: "2026-05-20",
    sort_order: 0,
    client_visible: true,
    created_at: "2026-04-01T09:00:00Z",
    updated_at: "2026-05-20T16:00:00Z",
  },
  {
    id: "m2",
    project_id: "p1",
    title: "Launch handoff",
    description: null,
    status: "upcoming",
    due_date: "2026-06-30",
    sort_order: 1,
    client_visible: false,
    created_at: "2026-04-01T09:00:00Z",
    updated_at: "2026-05-20T16:00:00Z",
  },
];

function t(status: TaskRow["status"]): Pick<TaskRow, "status"> {
  return { status };
}

const tasks: Pick<TaskRow, "status">[] = [
  t("done"),
  t("done"),
  t("done"),
  t("in_progress"),
  t("todo"),
  t("todo"),
  t("cancelled"),
];

const meta: Meta<typeof ProjectSummaryCard> = {
  title: "Features/Projects/ProjectSummaryCard",
  component: ProjectSummaryCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof ProjectSummaryCard>;

export const Default: Story = {
  args: {
    project: baseProject,
    milestones,
    tasks,
    expenses: [],
    currency: "AED",
    userDisplayName: "John Doe",
  },
};

export const OverBudget: Story = {
  args: {
    project: { ...baseProject, spent: 14000, budget: 15000 },
    milestones,
    tasks,
    expenses: [],
    currency: "AED",
    userDisplayName: "John Doe",
  },
};

export const NoTasks: Story = {
  args: {
    project: baseProject,
    milestones,
    tasks: [],
    expenses: [],
    currency: "AED",
    userDisplayName: "John Doe",
  },
};

export const AllTasksDone: Story = {
  args: {
    project: { ...baseProject, status: "completed" },
    milestones,
    tasks: [t("done"), t("done"), t("done")],
    expenses: [],
    currency: "AED",
    userDisplayName: "John Doe",
  },
};

export const Planning: Story = {
  args: {
    project: { ...baseProject, status: "planning" },
    milestones: [],
    tasks: [t("todo"), t("todo")],
    expenses: [],
    currency: "AED",
    userDisplayName: "John Doe",
  },
};

export const Completed: Story = {
  args: {
    project: { ...baseProject, status: "completed" },
    milestones,
    tasks: [t("done"), t("done"), t("done")],
    expenses: [],
    currency: "AED",
    userDisplayName: "John Doe",
  },
};
