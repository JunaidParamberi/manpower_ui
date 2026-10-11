import { describe, it, expect } from "vitest";

import {
  buildDigestFacts,
  completionPct,
  daysBetweenIso,
  detectBudgetSignal,
  detectDeadlineRisk,
  detectPaymentRisk,
  detectStaleness,
  scoreProjectHealth,
  type DigestInvoiceInput,
  type DigestProjectInput,
  type DigestSignal,
  type DigestTaskInput,
} from "./digest-facts";

const NOW = "2026-07-28T09:00:00.000Z";

function project(overrides: Partial<DigestProjectInput> = {}): DigestProjectInput {
  return {
    id: "p1",
    title: "Brand Refresh",
    status: "active",
    deadline: "2026-08-15",
    budget: 5000,
    updatedAt: "2026-07-27T09:00:00.000Z",
    ...overrides,
  };
}

function invoice(overrides: Partial<DigestInvoiceInput> = {}): DigestInvoiceInput {
  return {
    id: "i1",
    projectId: "p1",
    status: "sent",
    dueDate: "2026-07-01",
    total: 1200,
    ...overrides,
  };
}

function task(overrides: Partial<DigestTaskInput> = {}): DigestTaskInput {
  return {
    id: "t1",
    status: "todo",
    dueDate: null,
    updatedAt: "2026-07-27T09:00:00.000Z",
    ...overrides,
  };
}

describe("daysBetweenIso", () => {
  it("counts whole calendar days between two dates", () => {
    expect(daysBetweenIso("2026-07-28", "2026-08-04")).toBe(7);
  });

  it("returns a negative number when the target is in the past", () => {
    expect(daysBetweenIso("2026-07-28", "2026-07-21")).toBe(-7);
  });

  it("returns 0 for the same day regardless of time component", () => {
    expect(daysBetweenIso("2026-07-28T23:00:00.000Z", "2026-07-28T01:00:00.000Z")).toBe(0);
  });
});

describe("detectPaymentRisk", () => {
  it("flags an overdue invoice on an active project as critical", () => {
    const signal = detectPaymentRisk(project(), [invoice()], NOW);
    expect(signal).not.toBeNull();
    expect(signal?.kind).toBe("payment_risk");
    expect(signal?.severity).toBe("critical");
    expect(signal?.detail).toContain("27 days");
  });

  it("flags unpaid but not-yet-due invoices as info", () => {
    const signal = detectPaymentRisk(
      project(),
      [invoice({ dueDate: "2026-08-20" })],
      NOW,
    );
    expect(signal?.severity).toBe("info");
  });

  it("ignores paid and draft invoices", () => {
    const signal = detectPaymentRisk(
      project(),
      [invoice({ status: "paid" }), invoice({ id: "i2", status: "draft" })],
      NOW,
    );
    expect(signal).toBeNull();
  });

  it("ignores invoices belonging to a different project", () => {
    const signal = detectPaymentRisk(project(), [invoice({ projectId: "other" })], NOW);
    expect(signal).toBeNull();
  });

  it("returns null for projects that are not active", () => {
    const signal = detectPaymentRisk(project({ status: "completed" }), [invoice()], NOW);
    expect(signal).toBeNull();
  });

  it("sums the amount at risk across multiple unpaid invoices", () => {
    const signal = detectPaymentRisk(
      project(),
      [invoice(), invoice({ id: "i2", total: 800 })],
      NOW,
    );
    expect(signal?.detail).toContain("2000");
  });

  it("flags a partially_paid invoice — the real document_status enum value, not the nonexistent 'overdue'", () => {
    const signal = detectPaymentRisk(
      project(),
      [invoice({ status: "partially_paid" })],
      NOW,
    );
    expect(signal).not.toBeNull();
    expect(signal?.severity).toBe("critical");
  });

  it("does not treat 'overdue' as an unpaid status — it is not a real document_status value", () => {
    const signal = detectPaymentRisk(project(), [invoice({ status: "overdue" })], NOW);
    expect(signal).toBeNull();
  });
});

describe("scoreProjectHealth", () => {
  function signal(severity: DigestSignal["severity"]): DigestSignal {
    return { kind: "overdue_tasks", severity, title: "t", detail: "d" };
  }

  it("scores an empty signal list as 0 / low", () => {
    expect(scoreProjectHealth([])).toEqual({ score: 0, band: "low" });
  });

  it("weights critical above warning above info", () => {
    expect(scoreProjectHealth([signal("critical")]).score).toBe(40);
    expect(scoreProjectHealth([signal("warning")]).score).toBe(20);
    expect(scoreProjectHealth([signal("info")]).score).toBe(5);
  });

  it("bands a single critical signal as medium", () => {
    expect(scoreProjectHealth([signal("critical")]).band).toBe("medium");
  });

  it("bands two criticals as high", () => {
    expect(scoreProjectHealth([signal("critical"), signal("critical")]).band).toBe("high");
  });

  it("caps the score at 100", () => {
    const many = Array.from({ length: 6 }, () => signal("critical"));
    expect(scoreProjectHealth(many).score).toBe(100);
  });
});

describe("completionPct", () => {
  it("returns null (unknown) when there are no tasks", () => {
    expect(completionPct([])).toBeNull();
  });

  it("counts done tasks against the total", () => {
    expect(completionPct([task({ status: "done" }), task({ id: "t2" })])).toBe(50);
  });

  it("excludes cancelled tasks from the denominator", () => {
    const tasks = [task({ status: "done" }), task({ id: "t2", status: "cancelled" })];
    expect(completionPct(tasks)).toBe(100);
  });
});

describe("detectDeadlineRisk", () => {
  const soon = { deadline: "2026-07-31" }; // 3 days out from NOW

  it("is critical when the deadline is near and completion is low", () => {
    const tasks = [task(), task({ id: "t2" }), task({ id: "t3" }), task({ id: "t4" })];
    const signal = detectDeadlineRisk(project(soon), tasks, NOW);
    expect(signal?.severity).toBe("critical");
  });

  it("is only info when the deadline is near but work is nearly done", () => {
    const tasks = [
      task({ status: "done" }),
      task({ id: "t2", status: "done" }),
      task({ id: "t3", status: "done" }),
      task({ id: "t4", status: "done" }),
      task({ id: "t5" }),
    ];
    const signal = detectDeadlineRisk(project(soon), tasks, NOW);
    expect(signal?.severity).toBe("info");
  });

  it("is critical when the deadline has already passed and work is open", () => {
    const signal = detectDeadlineRisk(project({ deadline: "2026-07-20" }), [task()], NOW);
    expect(signal?.severity).toBe("critical");
    expect(signal?.detail).toContain("overdue");
  });

  it("returns null when the deadline is far away", () => {
    const signal = detectDeadlineRisk(project({ deadline: "2026-12-01" }), [task()], NOW);
    expect(signal).toBeNull();
  });

  it("returns null when there is no deadline", () => {
    expect(detectDeadlineRisk(project({ deadline: null }), [task()], NOW)).toBeNull();
  });

  it("returns null for projects that are not active", () => {
    expect(detectDeadlineRisk(project({ ...soon, status: "on_hold" }), [task()], NOW)).toBeNull();
  });

  it("still fires when the deadline has passed and there are zero tasks (unknown completion)", () => {
    const signal = detectDeadlineRisk(project({ deadline: "2026-07-01" }), [], NOW);
    expect(signal).not.toBeNull();
    expect(signal?.severity).toBe("critical");
    expect(signal?.detail).toContain("unknown");
  });

  it("treats zero tasks as unknown, not complete, near an upcoming deadline", () => {
    const signal = detectDeadlineRisk(project(soon), [], NOW);
    expect(signal).not.toBeNull();
    expect(signal?.severity).toBe("critical");
    expect(signal?.detail).toContain("unknown");
  });
});

describe("detectBudgetSignal", () => {
  it("is critical once spend exceeds budget", () => {
    const signal = detectBudgetSignal(project({ budget: 1000 }), 1200, NOW);
    expect(signal?.kind).toBe("over_budget");
    expect(signal?.severity).toBe("critical");
  });

  it("warns at 80% burn before the budget is breached", () => {
    const signal = detectBudgetSignal(project({ budget: 1000 }), 850, NOW);
    expect(signal?.kind).toBe("budget_burn");
    expect(signal?.severity).toBe("warning");
  });

  it("stays quiet below the burn threshold", () => {
    expect(detectBudgetSignal(project({ budget: 1000 }), 400, NOW)).toBeNull();
  });

  it("returns null when the project has no budget", () => {
    expect(detectBudgetSignal(project({ budget: null }), 999, NOW)).toBeNull();
  });
});

describe("detectStaleness", () => {
  it("flags overdue open tasks", () => {
    const tasks = [task({ dueDate: "2026-07-20" })];
    const kinds = detectStaleness(project(), tasks, NOW).map((s) => s.kind);
    expect(kinds).toContain("overdue_tasks");
  });

  it("escalates to critical past two overdue tasks", () => {
    const tasks = [
      task({ dueDate: "2026-07-20" }),
      task({ id: "t2", dueDate: "2026-07-21" }),
      task({ id: "t3", dueDate: "2026-07-22" }),
    ];
    const overdue = detectStaleness(project(), tasks, NOW).find(
      (s) => s.kind === "overdue_tasks",
    );
    expect(overdue?.severity).toBe("critical");
  });

  it("flags a project idle for 14+ days", () => {
    const stale = project({ updatedAt: "2026-07-01T09:00:00.000Z" });
    const tasks = [task({ updatedAt: "2026-07-02T09:00:00.000Z" })];
    const kinds = detectStaleness(stale, tasks, NOW).map((s) => s.kind);
    expect(kinds).toContain("idle_project");
  });

  it("does not flag idle when a task moved recently", () => {
    const stale = project({ updatedAt: "2026-07-01T09:00:00.000Z" });
    const tasks = [task({ updatedAt: "2026-07-27T09:00:00.000Z" })];
    const kinds = detectStaleness(stale, tasks, NOW).map((s) => s.kind);
    expect(kinds).not.toContain("idle_project");
  });
});

describe("buildDigestFacts", () => {
  it("returns projects sorted by score, highest risk first", () => {
    const facts = buildDigestFacts({
      nowIso: NOW,
      currency: "AED",
      projects: [
        // Deadline 5 days out but fully complete -> one info-level signal,
        // so it survives the no-signal filter and can be sorted below "risky".
        project({ id: "calm", title: "Calm", deadline: "2026-08-02", budget: null }),
        project({ id: "risky", title: "Risky", deadline: "2026-07-20", budget: 1000 }),
      ],
      tasksByProject: {
        calm: [task({ status: "done" })],
        risky: [task({ dueDate: "2026-07-10" }), task({ id: "t2", dueDate: "2026-07-11" })],
      },
      spentByProject: { calm: 0, risky: 1500 },
      invoices: [invoice({ projectId: "risky", dueDate: "2026-06-01" })],
    });

    expect(facts.currency).toBe("AED");
    expect(facts.generatedFor).toBe("2026-07-28");
    expect(facts.projects[0].id).toBe("risky");
    expect(facts.projects[0].band).toBe("high");
    expect(facts.projects[1].id).toBe("calm");
    expect(facts.projects[1].band).toBe("low");
  });

  it("omits projects with no signals at all", () => {
    const facts = buildDigestFacts({
      nowIso: NOW,
      currency: "USD",
      projects: [project({ id: "calm", deadline: "2026-12-01", budget: null })],
      tasksByProject: { calm: [task({ status: "done" })] },
      spentByProject: { calm: 0 },
      invoices: [],
    });
    expect(facts.projects).toHaveLength(0);
  });

  it("tolerates a project missing from the task and spend maps", () => {
    const facts = buildDigestFacts({
      nowIso: NOW,
      currency: "USD",
      // Near deadline (not overdue): empty tasks => unknown completion => critical
      // deadline signal, proving missing map keys do not throw.
      projects: [project({ id: "p1", deadline: "2026-07-31" })],
      tasksByProject: {},
      spentByProject: {},
      invoices: [],
    });
    expect(facts.projects).toHaveLength(1);
  });
});
