"use client";

import { KraftRecordHelp } from "@/components/features/ai-panel/kraft-record-help";
import { ClientTile } from "@/components/features/projects/client-tile";
import { ProjectStatusMark } from "@/components/features/projects/project-status-mark";
import type { RecordHelp } from "@/lib/kraft/record-help";
import type { Pace } from "@/lib/projects/project-pace";
import { formatShortDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { ProjectListRow } from "@/types";

/** Project title, status, client and due date, with Kraft help and actions on the right. */
export function ProjectFocusHeader({
  project,
  pace,
  kraftHelp,
  actions,
  className,
}: {
  project: ProjectListRow;
  pace: Pace;
  kraftHelp?: RecordHelp | null;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="truncate font-heading text-xl font-semibold tracking-[-0.015em]">{project.title}</h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-meta text-[var(--fg-2)]">
          <ProjectStatusMark status={project.status} withLabel />
          {project.client ? <ClientTile name={project.client.name} /> : null}
          {project.deadline ? (
            <span className={pace.kind === "late" ? "font-medium text-[var(--danger)]" : undefined}>
              Due {formatShortDate(project.deadline)}
            </span>
          ) : null}
        </div>
      </div>
      {actions || kraftHelp ? (
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Kraft's record help: problems it spotted + next steps. */}
          {kraftHelp ? <KraftRecordHelp help={kraftHelp} /> : null}
          {actions}
        </div>
      ) : null}
    </header>
  );
}
