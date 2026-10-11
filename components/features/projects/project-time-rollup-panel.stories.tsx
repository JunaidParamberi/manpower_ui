import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type {
  ExpenseListRow,
  ProjectListRow,
  TaskRow,
  TimeEntryListRow,
} from "@/types";

import { ProjectTimeRollupPanel } from "./project-time-rollup-panel";

const project = {
  id: "p1",
  budget: 12000,
  spent: 1000,
  title: "Brand Refresh 2026",
  status: "active",
  client: { id: "c1", name: "Acme" },
} as ProjectListRow;

const tasks: TaskRow[] = [
  {
    id: "t1",
    project_id: "p1",
    title: "Homepage mockup",
    status: "done",
    due_date: null,
    priority: "high",
    labels: [],
    description: null,
    start_date: null,
    completed_at: "2026-06-02T10:00:00Z",
    estimated_minutes: 240,
    sort_order: 0,
    client_visible: true,
    parent_task_id: null,
    milestone_id: null,
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-02T10:00:00Z",
  },
];

const expenses = [
  { amount: 2400, currency: "AED" },
  { amount: 650, currency: "AED" },
] as ExpenseListRow[];

const timeEntries = [
  { duration_seconds: 7200, billed: true },
  { duration_seconds: 5400, billed: false },
] as TimeEntryListRow[];

const meta: Meta<typeof ProjectTimeRollupPanel> = {
  title: "Features/Projects/ProjectTimeRollupPanel",
  component: ProjectTimeRollupPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Summarizes project budget, tracked time, and unbilled time from existing expense and time records. Use this in project workspaces, not as a full accounting report.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectTimeRollupPanel>;

export const Default: Story = {
  args: {
    project,
    tasks,
    expenses,
    timeEntries,
    currency: "AED",
  },
};

export const EmptyData: Story = {
  args: {
    project: { ...project, budget: null, spent: null },
    tasks: [],
    expenses: [],
    timeEntries: [],
    currency: "AED",
  },
};
