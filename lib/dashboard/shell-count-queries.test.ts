import { describe, expect, it, vi } from "vitest";

import {
  buildClientCountQuery,
  buildDocCountThisMonthQuery,
} from "@/lib/dashboard/shell-count-queries";

describe("buildClientCountQuery", () => {
  it("counts clients scoped to the owner", () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    const supabase = { from: vi.fn().mockReturnValue(query) };

    buildClientCountQuery(supabase, "user-123");

    expect(supabase.from).toHaveBeenCalledWith("clients");
    expect(query.select).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-123");
  });
});

describe("buildDocCountThisMonthQuery", () => {
  it("counts documents scoped to the owner since month start", () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
    };
    const supabase = { from: vi.fn().mockReturnValue(query) };

    buildDocCountThisMonthQuery(
      supabase,
      "user-123",
      "2026-06-01T00:00:00.000Z",
    );

    expect(supabase.from).toHaveBeenCalledWith("documents");
    expect(query.select).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-123");
    expect(query.gte).toHaveBeenCalledWith(
      "created_at",
      "2026-06-01T00:00:00.000Z",
    );
  });
});
