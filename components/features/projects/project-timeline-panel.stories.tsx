import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ProjectMilestoneRow, TaskRow } from "@/types";

import { ProjectTimelinePanel } from "./project-timeline-panel";

const milestones: ProjectMilestoneRow[] = [
  {
    id: "m1",
    project_id: "p1",
    title: "Design approval",
    description: "Client signs off on the visual direction.",
    status: "in_progress",
    due_date: "2026-06-15",
    sort_order: 0,
    client_visible: true,
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-01T10:00:00Z",
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
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-01T10:00:00Z",
  },
];

const tasks: TaskRow[] = [
  {
    id: "t1",
    project_id: "p1",
    title: "Homepage mockup",
    status: "done",
    due_date: "2026-06-10",
    priority: "high",
    labels: [],
    description: null,
    start_date: null,
    completed_at: "2026-06-08T12:00:00Z",
    estimated_minutes: 180,
    sort_order: 0,
    client_visible: true,
    parent_task_id: null,
    milestone_id: "m1",
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-08T12:00:00Z",
  },
  {
    id: "t2",
    project_id: "p1",
    title: "Design review call",
    status: "in_progress",
    due_date: "2026-06-15",
    priority: "medium",
    labels: [],
    description: null,
    start_date: null,
    completed_at: null,
    estimated_minutes: 60,
    sort_order: 1,
    client_visible: true,
    parent_task_id: null,
    milestone_id: "m1",
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-01T10:00:00Z",
  },
];

const meta: Meta<typeof ProjectTimelinePanel> = {
  title: "Features/Projects/ProjectTimelinePanel",
  component: ProjectTimelinePanel,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A lightweight project timeline for freelancer delivery checkpoints. Use it for milestones and milestone-level progress, not full dependency-heavy Gantt planning.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectTimelinePanel>;

export const Default: Story = {
  args: {
    projectId: "p1",
    milestones,
    tasks,
  },
};

export const Empty: Story = {
  args: {
    projectId: "p1",
    milestones: [],
    tasks: [],
  },
};
