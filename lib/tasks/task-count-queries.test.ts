import { describe, expect, it, vi } from "vitest";

import { buildOpenTaskCountQuery } from "@/lib/tasks/task-count-queries";

describe("buildOpenTaskCountQuery", () => {
  it("scopes open task counts through the parent project owner", () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    };
    const supabase = {
      from: vi.fn().mockReturnValue(query),
    };

    buildOpenTaskCountQuery(supabase, "user-123");

    expect(supabase.from).toHaveBeenCalledWith("tasks");
    expect(query.select).toHaveBeenCalledWith("id, projects!inner(user_id)", {
      count: "exact",
      head: true,
    });
    expect(query.eq).toHaveBeenCalledWith("projects.user_id", "user-123");
    expect(query.eq).not.toHaveBeenCalledWith("user_id", "user-123");
    expect(query.in).toHaveBeenCalledWith("status", ["todo", "in_progress"]);
  });
});
