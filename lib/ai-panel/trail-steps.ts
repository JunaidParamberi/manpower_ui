/**
 * One step in a turn's live activity trail. Tool execution in the assistant
 * loop is strictly serial (`await`ed one at a time), so there is at most one
 * "running" step at any point — resolving it on the next action/tool_error
 * event never needs a tool-use id to disambiguate.
 */
export type TrailStep = {
  tool: string;
  entity: string | null;
  label: string;
  status: "running" | "done" | "error";
};

export type TrailEvent =
  | { kind: "tool_start"; tool: string; entity: string | null; label: string }
  | { kind: "tool_done"; summary: string }
  | { kind: "action"; summary: string }
  | { kind: "tool_error"; message: string };

function lastRunningIndex(steps: TrailStep[]): number {
  for (let i = steps.length - 1; i >= 0; i -= 1) {
    if (steps[i].status === "running") {
      return i;
    }
  }
  return -1;
}

export function applyTrailEvent(steps: TrailStep[], event: TrailEvent): TrailStep[] {
  if (event.kind === "tool_start") {
    return [
      ...steps,
      { tool: event.tool, entity: event.entity, label: event.label, status: "running" },
    ];
  }

  const index = lastRunningIndex(steps);
  if (index === -1) {
    return steps;
  }

  const resolved: TrailStep = {
    ...steps[index],
    status: event.kind === "tool_error" ? "error" : "done",
    label: event.kind === "tool_error" ? event.message : event.summary,
  };

  return [...steps.slice(0, index), resolved, ...steps.slice(index + 1)];
}

type StepRecord = { entity: string; entityId: string | null; summary: string };

/**
 * Pairs each completed write step with the `action` event it produced, so
 * the trail can show record chips under the step that touched them. The
 * server emits exactly one `action` per successful non-`query_data` tool,
 * in order, with `entity` falling back to the tool name — so the pairing is
 * positional, guarded by that entity. Steps without a record (reads,
 * errors, a write whose action has not arrived yet) map to `null`.
 */
export function recordsForSteps<T extends StepRecord>(steps: TrailStep[], actions: T[]): (T | null)[] {
  let next = 0;
  return steps.map((step) => {
    if (step.status !== "done" || step.tool === "query_data") {
      return null;
    }
    const action = actions[next];
    if (!action || action.entity !== (step.entity ?? step.tool)) {
      return null;
    }
    next += 1;
    return action;
  });
}

/** Number of steps that have resolved to done — the mascot's "found something" signal. */
export function countDoneSteps(steps: TrailStep[]): number {
  return steps.reduce((count, step) => count + (step.status === "done" ? 1 : 0), 0);
}

export type PresentedStepStatus = TrailStep["status"] | "retried";

export type PresentedStep = Omit<TrailStep, "status"> & {
  status: PresentedStepStatus;
  /** Index in the original `steps` array, for record pairing. */
  index: number;
};

/**
 * How the trail should read to the user. A failed call that a later call
 * of the same tool on the same entity recovered from is not an error the
 * user needs to see — the assistant corrected its own query (a wrong
 * column, a status that doesn't exist). It shows as a muted "retried"
 * step; only failures nothing recovered from stay red.
 */
export function presentTrailSteps(steps: TrailStep[]): PresentedStep[] {
  return steps.map((step, index) => {
    if (step.status !== "error") {
      return { ...step, index };
    }
    const recovered = steps
      .slice(index + 1)
      .some((later) => later.status === "done" && later.tool === step.tool && later.entity === step.entity);
    if (!recovered) {
      return { ...step, index };
    }
    return {
      ...step,
      status: "retried",
      label: step.tool === "query_data" ? "Refined the search" : "Adjusted and tried again",
      index,
    };
  });
}

/**
 * One line that stands for the whole trail once it is folded: the running
 * step's own label while Kraft works, then a count of what it did.
 */
export function trailSummary(steps: TrailStep[]): string {
  const running = steps.find((step) => step.status === "running");
  if (running) {
    return running.label;
  }
  const presented = presentTrailSteps(steps).filter((step) => step.status !== "retried");
  const writes = presented.filter((step) => step.status === "done" && step.tool !== "query_data").length;
  const reads = presented.filter((step) => step.status === "done" && step.tool === "query_data").length;
  const failed = presented.filter((step) => step.status === "error").length;

  const parts: string[] = [];
  if (writes > 0) {
    parts.push(`Made ${writes} ${writes === 1 ? "change" : "changes"}`);
  }
  if (reads > 0) {
    parts.push(writes > 0 ? `checked ${reads} ${reads === 1 ? "thing" : "things"}` : `Checked ${reads} ${reads === 1 ? "thing" : "things"}`);
  }
  if (failed > 0) {
    parts.push(`${failed} failed`);
  }
  return parts.join(", ") || "Worked on it";
}
