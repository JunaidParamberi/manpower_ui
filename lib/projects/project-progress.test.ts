import { describe, expect, it } from "vitest";
import { computeTaskProgress, computeSubtaskProgress } from "./project-progress";
import type { TaskRow } from "@/types";

function t(status: TaskRow["status"]): Pick<TaskRow, "status"> {
  return { status };
}

describe("computeTaskProgress", () => {
  it("returns 0/0 for empty task list", () => {
    const result = computeTaskProgress([]);
    expect(result).toEqual({ done: 0, total: 0, percent: 0 });
  });

  it("counts done tasks correctly", () => {
    const result = computeTaskProgress([t("done"), t("done"), t("todo"), t("in_progress")]);
    expect(result.done).toBe(2);
    expect(result.total).toBe(4);
    expect(result.percent).toBe(50);
  });

  it("excludes cancelled tasks from total", () => {
    const result = computeTaskProgress([t("done"), t("cancelled"), t("todo")]);
    expect(result.total).toBe(2);
    expect(result.done).toBe(1);
    expect(result.percent).toBe(50);
  });

  it("returns 100 when all non-cancelled tasks are done", () => {
    const result = computeTaskProgress([t("done"), t("done"), t("cancelled")]);
    expect(result.percent).toBe(100);
    expect(result.total).toBe(2);
  });

  it("returns 0 when total is 0 (all cancelled)", () => {
    const result = computeTaskProgress([t("cancelled"), t("cancelled")]);
    expect(result.percent).toBe(0);
    expect(result.total).toBe(0);
  });

  it("rounds percent to nearest integer", () => {
    // 1/3 ≈ 33.33
    const result = computeTaskProgress([t("done"), t("todo"), t("todo")]);
    expect(result.percent).toBe(33);
  });

  it("handles all done", () => {
    const result = computeTaskProgress([t("done"), t("done")]);
    expect(result.percent).toBe(100);
  });

  it("handles none done", () => {
    const result = computeTaskProgress([t("todo"), t("in_progress")]);
    expect(result.percent).toBe(0);
    expect(result.total).toBe(2);
  });
});

describe("computeSubtaskProgress", () => {
  it("delegates to computeTaskProgress logic", () => {
    const result = computeSubtaskProgress([t("done"), t("todo"), t("cancelled")]);
    expect(result.done).toBe(1);
    expect(result.total).toBe(2);
    expect(result.percent).toBe(50);
  });
});
