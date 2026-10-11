import { describe, expect, it } from "vitest";

import {
  PROJECT_LIMITS,
  parseProjectCreateInput,
  parseProjectUpdateInput,
} from "@/lib/validations/project";

function validCreate() {
  return {
    client_id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Website redesign",
    status: "active" as const,
    budget: "",
    spent: "",
    start_date: "",
    deadline: "",
  };
}

describe("parseProjectCreateInput", () => {
  it("accepts minimal payload with empty money and dates", () => {
    const result = parseProjectCreateInput(validCreate());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Website redesign");
      expect(result.data.status).toBe("active");
      expect(result.data.budget).toBeNull();
      expect(result.data.spent).toBeNull();
      expect(result.data.start_date).toBeNull();
      expect(result.data.deadline).toBeNull();
    }
  });

  it("parses ISO dates and numeric budget", () => {
    const result = parseProjectCreateInput({
      ...validCreate(),
      start_date: "2026-06-01",
      deadline: "2026-12-31",
      budget: "1500.50",
      spent: 200,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.start_date).toBe("2026-06-01");
      expect(result.data.deadline).toBe("2026-12-31");
      expect(result.data.budget).toBe(1500.5);
      expect(result.data.spent).toBe(200);
    }
  });

  it("rejects invalid status", () => {
    const result = parseProjectCreateInput({
      ...validCreate(),
      status: "unknown",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = parseProjectCreateInput({
      ...validCreate(),
      title: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = parseProjectCreateInput({
      ...validCreate(),
      start_date: "06-01-2026",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative budget", () => {
    const result = parseProjectCreateInput({
      ...validCreate(),
      budget: "-1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over max length", () => {
    const result = parseProjectCreateInput({
      ...validCreate(),
      title: "x".repeat(PROJECT_LIMITS.title + 1),
    });
    expect(result.success).toBe(false);
  });
});

describe("parseProjectUpdateInput", () => {
  it("accepts partial update", () => {
    const result = parseProjectUpdateInput({ status: "completed" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("completed");
      expect(result.data.title).toBeUndefined();
    }
  });

  it("rejects empty update object", () => {
    const result = parseProjectUpdateInput({});
    expect(result.success).toBe(false);
  });

  it("allows nulling budget explicitly", () => {
    const result = parseProjectUpdateInput({ budget: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.budget).toBeNull();
    }
  });
});
