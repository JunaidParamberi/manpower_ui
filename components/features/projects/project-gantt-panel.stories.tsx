import type { Meta, StoryObj } from "@storybook/react";

import { ProjectGanttPanel } from "./project-gantt-panel";
import type { ProjectMilestoneRow, TaskRow } from "@/types";

const meta: Meta<typeof ProjectGanttPanel> = {
  title: "Features/Projects/ProjectGanttPanel",
  component: ProjectGanttPanel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Horizontal-bar Gantt chart of a project's top-level tasks, driven by `start_date`/`due_date`. " +
          "Drag a bar left or right to reschedule it (duration is preserved). Milestone due dates render as " +
          "vertical markers. Use this inside the project Timeline tab's Gantt sub-view, alongside " +
          "`ProjectTimelinePanel` (the milestone list view). Not for showing subtasks or client-portal timelines.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectGanttPanel>;

function task(overrides: Partial<TaskRow>): TaskRow {
  return {
    id: crypto.randomUUID(),
    project_id: "project-1",
    title: "Untitled task",
    status: "todo",
    due_date: null,
    priority: "medium",
    labels: [],
    description: null,
    start_date: null,
    completed_at: null,
    estimated_minutes: null,
    sort_order: 0,
    client_visible: false,
    parent_task_id: null,
    milestone_id: null,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function milestone(overrides: Partial<ProjectMilestoneRow>): ProjectMilestoneRow {
  return {
    id: crypto.randomUUID(),
    project_id: "project-1",
    title: "Untitled milestone",
    description: null,
    status: "upcoming",
    due_date: null,
    sort_order: 0,
    client_visible: false,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export const Populated: Story = {
  args: {
    projectId: "project-1",
    tasks: [
      task({ title: "Discovery call", status: "done", start_date: "2026-08-01", due_date: "2026-08-02" }),
      task({ title: "Wireframes", status: "in_progress", start_date: "2026-08-03", due_date: "2026-08-08" }),
      task({ title: "Client review", status: "todo", due_date: "2026-08-10" }),
      task({ title: "Development", status: "todo", start_date: "2026-08-11", due_date: "2026-08-22" }),
      task({ title: "Launch prep", status: "todo", start_date: "2026-08-23", due_date: "2026-08-25" }),
    ],
    milestones: [
      milestone({ title: "Design approved", due_date: "2026-08-09" }),
      milestone({ title: "Go live", due_date: "2026-08-26" }),
    ],
  },
};

export const Empty: Story = {
  args: {
    projectId: "project-1",
    tasks: [
      task({ title: "No due date yet", status: "todo", due_date: null }),
    ],
    milestones: [],
  },
};

export const AllCompleted: Story = {
  name: "All tasks done/cancelled (hidden by default)",
  args: {
    projectId: "project-1",
    tasks: [
      task({ title: "Kickoff", status: "done", start_date: "2026-08-01", due_date: "2026-08-01" }),
      task({ title: "Abandoned scope", status: "cancelled", due_date: "2026-08-03" }),
    ],
    milestones: [],
  },
};

export const WideProject: Story = {
  name: "Long project (scroll-heavy)",
  args: {
    projectId: "project-1",
    tasks: Array.from({ length: 12 }, (_, i) =>
      task({
        title: `Sprint ${i + 1} deliverable`,
        status: i < 3 ? "done" : "todo",
        start_date: `2026-${String(8 + Math.floor(i / 4)).padStart(2, "0")}-${String((i % 4) * 7 + 1).padStart(2, "0")}`,
        due_date: `2026-${String(8 + Math.floor(i / 4)).padStart(2, "0")}-${String((i % 4) * 7 + 5).padStart(2, "0")}`,
      }),
    ),
    milestones: [milestone({ title: "Mid-project check-in", due_date: "2026-09-15" })],
  },
};
