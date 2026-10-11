import { describe, expect, it } from "vitest";

import {
  MILESTONE_LIMITS,
  parseMilestoneCreateInput,
  parseMilestoneUpdateInput,
} from "@/lib/validations/milestone";

function validCreate() {
  return {
    title: "Design approval",
    description: "Client signs off on the visual direction.",
    status: "upcoming" as const,
    due_date: "2026-06-15",
    sort_order: 2,
    client_visible: true,
  };
}

describe("parseMilestoneCreateInput", () => {
  it("normalizes a milestone payload", () => {
    const result = parseMilestoneCreateInput({
      ...validCreate(),
      title: "  Design approval  ",
      description: "  Client signs off.  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Design approval");
      expect(result.data.description).toBe("Client signs off.");
      expect(result.data.status).toBe("upcoming");
      expect(result.data.due_date).toBe("2026-06-15");
      expect(result.data.sort_order).toBe(2);
      expect(result.data.client_visible).toBe(true);
    }
  });

  it("rejects invalid milestone values", () => {
    const result = parseMilestoneCreateInput({
      ...validCreate(),
      title: "x".repeat(MILESTONE_LIMITS.title + 1),
      status: "waiting",
      due_date: "June 15",
      sort_order: -1,
    });

    expect(result.success).toBe(false);
  });
});

describe("parseMilestoneUpdateInput", () => {
  it("accepts partial milestone updates", () => {
    const result = parseMilestoneUpdateInput({
      status: "completed",
      due_date: "",
      client_visible: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("completed");
      expect(result.data.due_date).toBeNull();
      expect(result.data.client_visible).toBe(false);
    }
  });

  it("rejects empty milestone updates", () => {
    const result = parseMilestoneUpdateInput({});
    expect(result.success).toBe(false);
  });
});
