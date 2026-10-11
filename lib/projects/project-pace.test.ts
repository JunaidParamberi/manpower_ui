import { describe, expect, it } from "vitest";

import { computePace, daysFrom, type PaceInput } from "./project-pace";

const base: PaceInput = {
  status: "active",
  startDate: "2026-09-01",
  createdAt: "2026-08-20T10:00:00Z",
  deadline: "2026-10-31",
  workDone: 0.5,
  budget: 10000,
  spent: 5000,
  today: "2026-10-01",
  hasTasks: true,
};

describe("daysFrom", () => {
  it("counts whole days between ISO dates or timestamps", () => {
    expect(daysFrom("2026-10-01", "2026-10-08")).toBe(7);
    expect(daysFrom("2026-10-08T23:00:00Z", "2026-10-09")).toBe(1);
    expect(daysFrom("2026-10-08", "2026-10-01")).toBe(-7);
  });
});

describe("computePace", () => {
  it("maps non-active statuses first", () => {
    expect(computePace({ ...base, status: "completed" }).kind).toBe("delivered");
    expect(computePace({ ...base, status: "on_hold" }).kind).toBe("paused");
    const plan = computePace({ ...base, status: "planning", startDate: "2026-10-11" });
    expect(plan.kind).toBe("not_started");
    expect(plan.detail).toBe("Starts in 10 days");
  });

  it("reports no_dates without a deadline and draws no time tick", () => {
    const p = computePace({ ...base, deadline: null });
    expect(p.kind).toBe("no_dates");
    expect(p.label).toBe("No deadline set");
    expect(p.timeElapsed).toBeNull();
  });

  it("is late after the deadline while work remains", () => {
    const p = computePace({ ...base, deadline: "2026-09-20", workDone: 0.14 });
    expect(p.kind).toBe("late");
    expect(p.label).toBe("11 days late");
    expect(p.needsYou).toBe(true);
  });

  it("is not late after the deadline when all work is done", () => {
    expect(computePace({ ...base, deadline: "2026-09-20", workDone: 1 }).kind).not.toBe("late");
  });

  it("flags over-budget pace past the threshold", () => {
    const p = computePace({ ...base, workDone: 0.5, spent: 7600 });
    expect(p.kind).toBe("over_budget");
    expect(p.label).toBe("Over budget pace");
    expect(p.detail).toBe("76% of budget used for 50% of the work");
  });

  it("stays on pace at exactly the over-budget threshold", () => {
    expect(computePace({ ...base, workDone: 0.5, spent: 7500 }).kind).not.toBe("over_budget");
  });

  it("flags behind when time runs ahead of work", () => {
    // Sep 1 → Oct 31 is 60 days; Oct 1 is 30 days in = 50% elapsed
    const p = computePace({ ...base, workDone: 0.3, spent: 3000 });
    expect(p.kind).toBe("behind");
    expect(p.label).toBe("Behind by 20 pts");
    expect(p.timeElapsed).toBeCloseTo(0.5, 2);
  });

  it("is on pace within the threshold and ahead when work leads", () => {
    expect(computePace({ ...base, workDone: 0.4, spent: 4000 }).kind).toBe("on_pace");
    expect(computePace({ ...base, workDone: 0.7, spent: 4000 }).kind).toBe("ahead");
  });

  it("falls back to created_at when start_date is missing", () => {
    const p = computePace({ ...base, startDate: null });
    expect(p.timeElapsed).not.toBeNull();
    expect(p.timeElapsed).toBeGreaterThan(0.5);
  });

  it("gives no pace signal for an active project without tasks", () => {
    const p = computePace({ ...base, hasTasks: false, workDone: 0, spent: 9000 });
    expect(p.kind).toBe("untracked");
    expect(p.label).toBe("No tasks yet");
    expect(p.needsYou).toBe(false);
  });

  it("still calls a task-less project late once its deadline has passed", () => {
    expect(computePace({ ...base, hasTasks: false, workDone: 0, deadline: "2026-09-20" }).kind).toBe("late");
  });

  it("says all tasks are done instead of ahead when the work is finished", () => {
    const p = computePace({ ...base, workDone: 1, deadline: "2026-09-20" });
    expect(p.kind).toBe("ahead");
    expect(p.label).toBe("All tasks done");
    expect(p.detail).toBe("Mark the project complete when it's delivered");
    expect(p.needsYou).toBe(false);
  });

  it("ignores budget when none is set", () => {
    const p = computePace({ ...base, budget: null, spent: 999999 });
    expect(p.budgetUsed).toBeNull();
    expect(p.kind).not.toBe("over_budget");
  });

  it("clamps elapsed time to 0..1", () => {
    expect(computePace({ ...base, today: "2026-08-01" }).timeElapsed).toBe(0);
    expect(computePace({ ...base, today: "2026-12-01", workDone: 1 }).timeElapsed).toBe(1);
  });
});
