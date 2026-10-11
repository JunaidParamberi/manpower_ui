"use client";

import { GanttChart, KanbanSquare, LayoutList } from "lucide-react";

import type { ProjectsListLayout } from "@/lib/projects/list-layout-preference";
import { cn } from "@/lib/utils";

const VIEWS: { id: ProjectsListLayout; label: string; Icon: typeof LayoutList }[] = [
  { id: "list", label: "List", Icon: LayoutList },
  { id: "board", label: "Board", Icon: KanbanSquare },
  { id: "timeline", label: "Timeline", Icon: GanttChart },
];

/** List / Board / Timeline switch for the projects page. */
export function ProjectsViewSwitch({ view, onChange }: { view: ProjectsListLayout; onChange: (view: ProjectsListLayout) => void }) {
  return (
    <div role="group" aria-label="View" className="flex h-[30px] shrink-0 items-center gap-0.5 rounded-md bg-[var(--bg-subtle)] p-0.5">
      {VIEWS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          aria-label={label}
          title={label}
          onClick={() => onChange(id)}
          className={cn(
            "grid h-[26px] w-[30px] place-items-center rounded-[6px] border-0",
            view === id ? "bg-card text-foreground shadow-[var(--shadow-sm)]" : "bg-transparent text-[var(--fg-3)] hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
