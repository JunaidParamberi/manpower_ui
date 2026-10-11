"use client";

import {
  AlertCircle,
  Check,
  CheckSquare,
  Clock,
} from "lucide-react";

import {
  buildTasksHref,
  countDoneThisMonthTasks,
  countDueTodayTasks,
  countOpenTasks,
  countOverdueTasks,
  type TaskListFilters,
} from "@/lib/tasks/task-utils";
import type { TaskListRow } from "@/types";

import { KpiCard } from "@/components/shared/kpi-card";

type TasksSummaryStripProps = {
  tasks: TaskListRow[];
  filters: TaskListFilters;
};

export function TasksSummaryStrip({ tasks, filters }: TasksSummaryStripProps) {
  const open = countOpenTasks(tasks);
  const dueToday = countDueTodayTasks(tasks);
  const overdue = countOverdueTasks(tasks);
  const doneMonth = countDoneThisMonthTasks(tasks);

  const tiles = [
    {
      key: "open" as const,
      label: "Open",
      value: open,
      tone: "info" as const,
      icon: CheckSquare,
    },
    {
      key: "today" as const,
      label: "Due today",
      value: dueToday,
      tone: "warning" as const,
      icon: Clock,
    },
    {
      key: "overdue" as const,
      label: "Overdue",
      value: overdue,
      tone: "danger" as const,
      icon: AlertCircle,
    },
    {
      key: "done" as const,
      label: "Done this month",
      value: doneMonth,
      tone: "success" as const,
      icon: Check,
    },
  ];

  return (
    <div className="mb-[22px] grid gap-3 @sm/shell:grid-cols-2 @3xl/shell:grid-cols-4">
      {tiles.map((tile, index) => (
        <KpiCard
          key={tile.key}
          label={tile.label}
          value={tile.value}
          tone={tile.tone}
          icon={tile.icon}
          href={buildTasksHref({ view: tile.key }, filters)}
          active={filters.view === tile.key}
          delay={index * 40}
        />
      ))}
    </div>
  );
}
