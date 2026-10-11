import { describe, expect, it } from "vitest";

import {
  TASK_LIMITS,
  parseTaskCommentCreateInput,
  parseTaskCreateInput,
  parseTaskUpdateInput,
} from "@/lib/validations/task";

function validCreate() {
  return {
    title: "Kickoff call",
    status: "todo" as const,
    priority: "high" as const,
    due_date: "",
    labels: [] as string[],
  };
}

describe("parseTaskCreateInput", () => {
  it("accepts minimal payload", () => {
    const result = parseTaskCreateInput(validCreate());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Kickoff call");
      expect(result.data.status).toBe("todo");
      expect(result.data.priority).toBe("high");
      expect(result.data.due_date).toBeNull();
    }
  });

  it("parses due date", () => {
    const result = parseTaskCreateInput({
      ...validCreate(),
      due_date: "2026-05-20",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.due_date).toBe("2026-05-20");
    }
  });

  it("rejects invalid status", () => {
    const result = parseTaskCreateInput({
      ...validCreate(),
      status: "pending",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = parseTaskCreateInput({
      ...validCreate(),
      priority: "urgent",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = parseTaskCreateInput({
      ...validCreate(),
      title: "  ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over max length", () => {
    const result = parseTaskCreateInput({
      ...validCreate(),
      title: "x".repeat(TASK_LIMITS.title + 1),
    });
    expect(result.success).toBe(false);
  });

  it("accepts labels array", () => {
    const result = parseTaskCreateInput({
      ...validCreate(),
      labels: ["design", "copy"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.labels).toEqual(["design", "copy"]);
    }
  });

  it("rejects too many labels", () => {
    const result = parseTaskCreateInput({
      ...validCreate(),
      labels: Array.from({ length: TASK_LIMITS.labelsMax + 1 }, (_, i) => `l${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("normalizes richer task planning fields", () => {
    const parentId = "11111111-1111-4111-8111-111111111111";
    const result = parseTaskCreateInput({
      ...validCreate(),
      description: "  Share agenda before the call.  ",
      start_date: "2026-05-18",
      estimated_minutes: "90",
      sort_order: 12,
      client_visible: true,
      parent_task_id: parentId,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("Share agenda before the call.");
      expect(result.data.start_date).toBe("2026-05-18");
      expect(result.data.estimated_minutes).toBe(90);
      expect(result.data.sort_order).toBe(12);
      expect(result.data.client_visible).toBe(true);
      expect(result.data.parent_task_id).toBe(parentId);
    }
  });

  it("rejects invalid richer task planning fields", () => {
    const result = parseTaskCreateInput({
      ...validCreate(),
      start_date: "May 18",
      estimated_minutes: -1,
      parent_task_id: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });
});

describe("parseTaskUpdateInput", () => {
  it("accepts partial update", () => {
    const result = parseTaskUpdateInput({ status: "done" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("done");
    }
  });

  it("rejects empty update object", () => {
    const result = parseTaskUpdateInput({});
    expect(result.success).toBe(false);
  });

  it("accepts labels update", () => {
    const result = parseTaskUpdateInput({ labels: ["finance"] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.labels).toEqual(["finance"]);
    }
  });

  it("accepts richer task update fields", () => {
    const result = parseTaskUpdateInput({
      description: "",
      start_date: "",
      completed_at: "2026-06-01T10:30:00.000Z",
      estimated_minutes: "45",
      sort_order: 2,
      client_visible: false,
      parent_task_id: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
      expect(result.data.start_date).toBeNull();
      expect(result.data.completed_at).toBe("2026-06-01T10:30:00.000Z");
      expect(result.data.estimated_minutes).toBe(45);
      expect(result.data.sort_order).toBe(2);
      expect(result.data.client_visible).toBe(false);
      expect(result.data.parent_task_id).toBeNull();
    }
  });
});

describe("parseTaskCommentCreateInput", () => {
  it("normalizes a task comment", () => {
    const result = parseTaskCommentCreateInput({
      body: "  Shared the first draft with the client.  ",
      client_visible: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toBe("Shared the first draft with the client.");
      expect(result.data.client_visible).toBe(true);
    }
  });

  it("rejects blank task comments", () => {
    const result = parseTaskCommentCreateInput({ body: "   " });
    expect(result.success).toBe(false);
  });
});
