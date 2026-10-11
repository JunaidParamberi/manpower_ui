"use client";

import { useMemo } from "react";

import {
  buildProjectHealthSignals,
  type ProjectHealthSignal,
} from "@/lib/projects/project-intelligence";
import type { DigestInvoiceInput } from "@/lib/projects/digest-facts";
import { buildProjectRollup } from "@/lib/projects/project-rollups";
import type {
  ExpenseListRow,
  ProjectListRow,
  ProjectMilestoneRow,
  TaskRow,
  TimeEntryListRow,
} from "@/types";

import { Badge } from "@/components/ui/badge";

type ProjectHealthSignalsProps = {
  project: ProjectListRow;
  tasks: TaskRow[];
  milestones: ProjectMilestoneRow[];
  expenses: ExpenseListRow[];
  timeEntries: TimeEntryListRow[];
  invoices?: DigestInvoiceInput[];
};

function signalBadgeVariant(
  severity: ProjectHealthSignal["severity"],
): "danger" | "warning" | "info" {
  if (severity === "critical") return "danger";
  if (severity === "warning") return "warning";
  return "info";
}

export function ProjectHealthSignals({
  project,
  tasks,
  milestones,
  expenses,
  timeEntries,
  invoices,
}: ProjectHealthSignalsProps) {
  const signals = useMemo(() => {
    const rollup = buildProjectRollup({ project, tasks, expenses, timeEntries });
    return buildProjectHealthSignals({ project, tasks, milestones, rollup, invoices });
  }, [project, tasks, milestones, expenses, timeEntries, invoices]);

  if (signals.length === 0) {
    return null;
  }

  return (
    <section
      className="fade-up delay-2 flex flex-wrap gap-2"
      aria-label="Project health signals"
    >
      {signals.map((signal) => (
        <Badge
          key={signal.kind}
          variant={signalBadgeVariant(signal.severity)}
          title={signal.detail}
        >
          {signal.title}
        </Badge>
      ))}
    </section>
  );
}
