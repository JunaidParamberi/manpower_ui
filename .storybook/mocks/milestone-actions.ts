import type { ProjectMilestoneRow } from "@/types";

const mockMilestones: ProjectMilestoneRow[] = [
  {
    id: "m1",
    project_id: "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
    title: "Homepage approved",
    description: null,
    status: "pending",
    due_date: "2026-06-20",
    sort_order: 0,
    client_visible: true,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
  },
];

export async function listProjectMilestones() {
  return { ok: true as const, milestones: mockMilestones };
}

export async function createProjectMilestone(
  projectId: string,
  input: { title: string; due_date?: string | null; client_visible?: boolean },
) {
  const milestone: ProjectMilestoneRow = {
    id: `m-${Date.now()}`,
    project_id: projectId,
    title: input.title,
    description: null,
    status: "upcoming",
    due_date: input.due_date ?? null,
    sort_order: mockMilestones.length,
    client_visible: input.client_visible ?? false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockMilestones.push(milestone);
  return { ok: true as const, milestone };
}

export async function updateProjectMilestone(
  _projectId: string,
  milestoneId: string,
  input: Partial<Pick<ProjectMilestoneRow, "title" | "due_date" | "status">>,
) {
  const index = mockMilestones.findIndex((m) => m.id === milestoneId);
  if (index >= 0) {
    mockMilestones[index] = {
      ...mockMilestones[index],
      ...input,
      updated_at: new Date().toISOString(),
    };
    return { ok: true as const, milestone: mockMilestones[index] };
  }
  return { ok: false as const, message: "Milestone not found." };
}

export async function deleteProjectMilestone(
  _projectId: string,
  milestoneId: string,
) {
  const index = mockMilestones.findIndex((m) => m.id === milestoneId);
  if (index >= 0) {
    mockMilestones.splice(index, 1);
    return { ok: true as const };
  }
  return { ok: false as const, message: "Milestone not found." };
}
