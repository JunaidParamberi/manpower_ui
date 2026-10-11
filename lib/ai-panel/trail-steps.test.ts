import { describe, expect, it } from "vitest";

import {
  applyTrailEvent,
  countDoneSteps,
  presentTrailSteps,
  recordsForSteps,
  trailSummary,
  type TrailStep,
} from "./trail-steps";

describe("applyTrailEvent", () => {
  it("pushes a running step on tool_start", () => {
    const steps = applyTrailEvent([], {
      kind: "tool_start",
      tool: "query_data",
      entity: "clients",
      label: "Looking up clients…",
    });
    expect(steps).toEqual<TrailStep[]>([
      { tool: "query_data", entity: "clients", label: "Looking up clients…", status: "running" },
    ]);
  });

  it("resolves the running step to done on action, replacing its label", () => {
    const running: TrailStep[] = [
      { tool: "create_record", entity: "clients", label: "Creating clients…", status: "running" },
    ];
    const steps = applyTrailEvent(running, {
      kind: "action",
      summary: "Created client \"Acme Co\"",
    });
    expect(steps).toEqual<TrailStep[]>([
      {
        tool: "create_record",
        entity: "clients",
        label: "Created client \"Acme Co\"",
        status: "done",
      },
    ]);
  });

  it("resolves the running step to done on tool_done, replacing its label — the only signal a read (query_data) gets, since action is never sent for it", () => {
    const running: TrailStep[] = [
      { tool: "query_data", entity: "clients", label: "Looking up clients…", status: "running" },
    ];
    const steps = applyTrailEvent(running, {
      kind: "tool_done",
      summary: "3 clients row(s)",
    });
    expect(steps).toEqual<TrailStep[]>([
      { tool: "query_data", entity: "clients", label: "3 clients row(s)", status: "done" },
    ]);
  });

  it("resolves the running step to error on tool_error, replacing its label", () => {
    const running: TrailStep[] = [
      { tool: "update_record", entity: "projects", label: "Updating projects…", status: "running" },
    ];
    const steps = applyTrailEvent(running, {
      kind: "tool_error",
      message: "Could not update the projects record.",
    });
    expect(steps).toEqual<TrailStep[]>([
      {
        tool: "update_record",
        entity: "projects",
        label: "Could not update the projects record.",
        status: "error",
      },
    ]);
  });

  it("keeps earlier resolved steps untouched and appends the next running step", () => {
    const afterFirst: TrailStep[] = [
      { tool: "query_data", entity: "clients", label: "Read 3 clients", status: "done" },
    ];
    const steps = applyTrailEvent(afterFirst, {
      kind: "tool_start",
      tool: "create_record",
      entity: "clients",
      label: "Creating clients…",
    });
    expect(steps).toEqual<TrailStep[]>([
      { tool: "query_data", entity: "clients", label: "Read 3 clients", status: "done" },
      { tool: "create_record", entity: "clients", label: "Creating clients…", status: "running" },
    ]);
  });

  it("is a no-op for action/tool_error when no step is running", () => {
    const done: TrailStep[] = [
      { tool: "query_data", entity: "clients", label: "Read 3 clients", status: "done" },
    ];
    expect(applyTrailEvent(done, { kind: "action", summary: "Created client \"Acme\"" })).toBe(
      done,
    );
    expect(
      applyTrailEvent(done, { kind: "tool_error", message: "Failed." }),
    ).toBe(done);
  });
});

describe("recordsForSteps", () => {
  const created = { entity: "clients", entityId: "c1", summary: 'Created client "Acme"' };
  const drafted = { entity: "draft_email", entityId: null, summary: "Drafted the email" };

  it("pairs each completed write with its action, in order", () => {
    const steps: TrailStep[] = [
      { tool: "query_data", entity: "clients", label: "Read 3 clients", status: "done" },
      { tool: "create_record", entity: "clients", label: 'Created client "Acme"', status: "done" },
      { tool: "draft_email", entity: null, label: "Drafted the email", status: "done" },
    ];
    expect(recordsForSteps(steps, [created, drafted])).toEqual([null, created, drafted]);
  });

  it("leaves running and failed steps without a record", () => {
    const steps: TrailStep[] = [
      { tool: "update_record", entity: "projects", label: "Could not update.", status: "error" },
      { tool: "create_record", entity: "clients", label: "Creating clients…", status: "running" },
    ];
    expect(recordsForSteps(steps, [created])).toEqual([null, null]);
  });

  it("does not attach an action whose entity does not match", () => {
    const steps: TrailStep[] = [
      { tool: "create_record", entity: "tasks", label: "Created task", status: "done" },
    ];
    expect(recordsForSteps(steps, [created])).toEqual([null]);
  });
});

describe("countDoneSteps", () => {
  it("counts only resolved steps", () => {
    expect(
      countDoneSteps([
        { tool: "query_data", entity: "clients", label: "Read 3 clients", status: "done" },
        { tool: "create_record", entity: "clients", label: "Creating…", status: "running" },
        { tool: "update_record", entity: "projects", label: "Failed", status: "error" },
      ]),
    ).toBe(1);
  });
});

describe("presentTrailSteps", () => {
  it("mutes an error the next call on the same entity recovered from", () => {
    const presented = presentTrailSteps([
      { tool: "query_data", entity: "documents", label: '"overdue" is not a valid documents.status.', status: "error" },
      { tool: "query_data", entity: "documents", label: "Found 14 documents", status: "done" },
    ]);
    expect(presented[0]).toMatchObject({ status: "retried", label: "Refined the search", index: 0 });
    expect(presented[1]).toMatchObject({ status: "done", label: "Found 14 documents", index: 1 });
  });

  it("keeps an unrecovered error red", () => {
    const presented = presentTrailSteps([
      { tool: "query_data", entity: "tasks", label: "Found 2 tasks", status: "done" },
      { tool: "query_data", entity: "follow_ups", label: "Could not read follow ups.", status: "error" },
    ]);
    expect(presented[1].status).toBe("error");
    expect(presented[1].label).toBe("Could not read follow ups.");
  });

  it("does not count a recovery on a different entity", () => {
    const presented = presentTrailSteps([
      { tool: "query_data", entity: "follow_ups", label: "Could not read follow ups.", status: "error" },
      { tool: "query_data", entity: "tasks", label: "Found 2 tasks", status: "done" },
    ]);
    expect(presented[0].status).toBe("error");
  });
});

describe("trailSummary", () => {
  const read = (label: string): TrailStep => ({ tool: "query_data", entity: "documents", label, status: "done" });

  it("shows the running step while Kraft works", () => {
    expect(trailSummary([read("Found 3 quotes"), { tool: "query_data", entity: "clients", label: "Looking up clients…", status: "running" }])).toBe(
      "Looking up clients…",
    );
  });

  it("counts lookups", () => {
    expect(trailSummary([read("a"), read("b"), read("c")])).toBe("Checked 3 things");
    expect(trailSummary([read("a")])).toBe("Checked 1 thing");
  });

  it("leads with changes when there were writes", () => {
    const write: TrailStep = { tool: "create_record", entity: "documents", label: "Created invoice", status: "done" };
    expect(trailSummary([read("a"), read("b"), write])).toBe("Made 1 change, checked 2 things");
  });

  it("ignores a failure Kraft recovered from but reports one it didn't", () => {
    const failed: TrailStep = { tool: "query_data", entity: "documents", label: "bad column", status: "error" };
    expect(trailSummary([failed, read("ok")])).toBe("Checked 1 thing");
    const lost: TrailStep = { tool: "update_record", entity: "clients", label: "No such field", status: "error" };
    expect(trailSummary([read("ok"), lost])).toBe("Checked 1 thing, 1 failed");
  });
});
