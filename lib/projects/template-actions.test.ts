import { describe, expect, it, vi } from "vitest";
import { templateToPlanDraft } from "./template-utils";
import type { ProjectTemplateWithDetails } from "@/types";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}));

vi.mock("@/lib/supabase/get-server-context", () => ({
  getServerContext: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

const MILESTONE_A_ID = "aaaa0000-0000-4000-8000-000000000001";
const MILESTONE_B_ID = "aaaa0000-0000-4000-8000-000000000002";
const TEMPLATE_ID = "bbbb0000-0000-4000-8000-000000000001";

function makeTemplate(
  overrides?: Partial<ProjectTemplateWithDetails>,
): ProjectTemplateWithDetails {
  return {
    id: TEMPLATE_ID,
    user_id: "user-1",
    is_system: false,
    name: "My template",
    description: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    milestones: [
      {
        id: MILESTONE_A_ID,
        template_id: TEMPLATE_ID,
        title: "Design",
        description: "Visual design phase",
        sort_order: 0,
        client_visible: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: MILESTONE_B_ID,
        template_id: TEMPLATE_ID,
        title: "Development",
        description: null,
        sort_order: 1,
        client_visible: false,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ],
    tasks: [
      {
        id: "task-1",
        template_id: TEMPLATE_ID,
        milestone_template_id: MILESTONE_A_ID,
        title: "Create wireframes",
        description: null,
        estimated_minutes: 120,
        sort_order: 0,
        client_visible: false,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "task-2",
        template_id: TEMPLATE_ID,
        milestone_template_id: MILESTONE_B_ID,
        title: "Build API",
        description: "REST API",
        estimated_minutes: 480,
        sort_order: 1,
        client_visible: false,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "task-3",
        template_id: TEMPLATE_ID,
        milestone_template_id: null,
        title: "Standalone task",
        description: null,
        estimated_minutes: null,
        sort_order: 2,
        client_visible: false,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ],
    ...overrides,
  };
}

describe("templateToPlanDraft", () => {
  it("maps template milestones to plan draft milestones", () => {
    const draft = templateToPlanDraft(makeTemplate());
    expect(draft.milestones).toHaveLength(2);
    expect(draft.milestones[0].title).toBe("Design");
    expect(draft.milestones[0].client_visible).toBe(true);
    expect(draft.milestones[1].title).toBe("Development");
    expect(draft.milestones[1].client_visible).toBe(false);
  });

  it("maps tasks with correct milestone_title by template milestone id", () => {
    const draft = templateToPlanDraft(makeTemplate());
    expect(draft.tasks[0].title).toBe("Create wireframes");
    expect(draft.tasks[0].milestone_title).toBe("Design");
    expect(draft.tasks[1].milestone_title).toBe("Development");
  });

  it("sets milestone_title to null for tasks without a milestone", () => {
    const draft = templateToPlanDraft(makeTemplate());
    expect(draft.tasks[2].milestone_title).toBeNull();
  });

  it("preserves template name as title", () => {
    const draft = templateToPlanDraft(makeTemplate());
    expect(draft.title).toBe("My template");
  });

  it("handles template with no milestones or tasks", () => {
    const draft = templateToPlanDraft(makeTemplate({ milestones: [], tasks: [] }));
    expect(draft.milestones).toHaveLength(0);
    expect(draft.tasks).toHaveLength(0);
  });

  it("preserves estimated_minutes", () => {
    const draft = templateToPlanDraft(makeTemplate());
    expect(draft.tasks[0].estimated_minutes).toBe(120);
    expect(draft.tasks[2].estimated_minutes).toBeNull();
  });
});
