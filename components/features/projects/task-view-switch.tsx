"use client";

import { KanbanSquare, List } from "lucide-react";

import type { ProjectsHubViewMode } from "@/lib/projects/hub-view-preference";
import { cn } from "@/lib/utils";

const OPTIONS: { id: ProjectsHubViewMode; label: string; Icon: typeof List }[] = [
  { id: "list", label: "List", Icon: List },
  { id: "board", label: "Board", Icon: KanbanSquare },
];

/** List / Board switch for a project's tasks (refined segmented control). */
export function TaskViewSwitch({ value, onChange }: { value: ProjectsHubViewMode; onChange: (mode: ProjectsHubViewMode) => void }) {
  return (
    <div role="group" aria-label="Task view" className="flex h-8 items-center gap-0.5 rounded-md bg-[var(--bg-subtle)] p-0.5">
      {OPTIONS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-[6px] border-0 px-2.5 text-meta font-medium",
            value === id ? "bg-card text-foreground shadow-[var(--shadow-sm)]" : "bg-transparent text-[var(--fg-3)] hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
