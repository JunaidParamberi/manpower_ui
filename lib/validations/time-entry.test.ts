import { describe, expect, it } from "vitest";

import {
  parseTimeEntryManualCompleteInput,
  parseTimeEntryStartInput,
} from "@/lib/validations/time-entry";

const PROJECT_ID = "550e8400-e29b-41d4-a716-446655440000";
const TASK_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

describe("parseTimeEntryManualCompleteInput", () => {
  it("accepts valid range and computes duration_seconds", () => {
    const result = parseTimeEntryManualCompleteInput({
      project_id: PROJECT_ID,
      task_id: "",
      started_at: "2026-01-01T10:00:00.000Z",
      ended_at: "2026-01-01T11:30:00.000Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project_id).toBe(PROJECT_ID);
      expect(result.data.task_id).toBeNull();
      expect(result.data.started_at).toBe("2026-01-01T10:00:00.000Z");
      expect(result.data.ended_at).toBe("2026-01-01T11:30:00.000Z");
      expect(result.data.duration_seconds).toBe(5400);
      expect(result.data.description).toBeNull();
    }
  });

  it("stores trimmed description", () => {
    const result = parseTimeEntryManualCompleteInput({
      project_id: PROJECT_ID,
      description: "  Client kickoff  ",
      started_at: "2026-01-01T10:00:00.000Z",
      ended_at: "2026-01-01T11:00:00.000Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("Client kickoff");
    }
  });

  it("normalizes optional task_id uuid", () => {
    const result = parseTimeEntryManualCompleteInput({
      project_id: PROJECT_ID,
      task_id: TASK_ID,
      started_at: "2026-01-01T10:00:00.000Z",
      ended_at: "2026-01-01T10:00:01.000Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.task_id).toBe(TASK_ID);
      expect(result.data.duration_seconds).toBe(1);
    }
  });

  it("rejects ended_at before started_at", () => {
    const result = parseTimeEntryManualCompleteInput({
      project_id: PROJECT_ID,
      started_at: "2026-01-01T12:00:00.000Z",
      ended_at: "2026-01-01T11:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid project_id", () => {
    const result = parseTimeEntryManualCompleteInput({
      project_id: "not-a-uuid",
      started_at: "2026-01-01T10:00:00.000Z",
      ended_at: "2026-01-01T11:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed dates", () => {
    const result = parseTimeEntryManualCompleteInput({
      project_id: PROJECT_ID,
      started_at: "not a date",
      ended_at: "2026-01-01T11:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});

describe("parseTimeEntryStartInput", () => {
  it("accepts project and optional task", () => {
    const result = parseTimeEntryStartInput({
      project_id: PROJECT_ID,
      task_id: "",
      started_at: "2026-06-01T09:00:00.000Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project_id).toBe(PROJECT_ID);
      expect(result.data.task_id).toBeNull();
      expect(result.data.started_at).toBe("2026-06-01T09:00:00.000Z");
      expect(result.data.description).toBeNull();
    }
  });

  it("rejects missing project_id", () => {
    const result = parseTimeEntryStartInput({
      started_at: "2026-06-01T09:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty started_at", () => {
    const result = parseTimeEntryStartInput({
      project_id: PROJECT_ID,
      started_at: "",
    });
    expect(result.success).toBe(false);
  });
});
