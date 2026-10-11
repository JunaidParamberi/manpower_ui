import Link from "next/link";

import { getDocumentDueDateCountdown } from "@/lib/documents/display";
import type { ProjectListRow } from "@/types";
import { cn } from "@/lib/utils";
import { ProjectStatusMark } from "@/components/features/projects/project-status-mark";
import { ClientSection, ClientSectionEmpty, SECTION_LINK } from "@/components/features/clients/detail/client-section";

type ClientProjectsSectionProps = {
  clientId: string;
  /** Already filtered to this client (and limited, on Overview). */
  projects: ProjectListRow[];
  title?: string;
  /** Total before any limit; defaults to projects.length. */
  count?: number;
  /** When set, the header link switches to that tab instead of "New project". */
  viewAllHref?: string;
};

const DONE = new Set<ProjectListRow["status"]>(["completed", "archived"]);

const DUE_TONE = {
  destructive: "text-[var(--danger)]",
  amber: "text-[var(--warning)]",
  muted: "text-[var(--fg-3)]",
} as const;

export function ClientProjectsSection({
  clientId,
  projects,
  title = "Projects",
  count,
  viewAllHref,
}: ClientProjectsSectionProps) {
  const newHref = `/projects/new?client=${clientId}`;
  return (
    <ClientSection
      title={title}
      count={count ?? projects.length}
      action={
        viewAllHref ? (
          <Link href={viewAllHref} scroll={false} className={SECTION_LINK}>
            View all
          </Link>
        ) : (
          <Link href={newHref} className={SECTION_LINK}>
            New project
          </Link>
        )
      }
    >
      {projects.length === 0 ? (
        <ClientSectionEmpty>
          No open projects.{" "}
          <Link href={newHref} className={SECTION_LINK}>
            Start one
          </Link>
        </ClientSectionEmpty>
      ) : (
        projects.map((p) => {
          // "open" is never a settled status, so the countdown always applies to live projects.
          const due = DONE.has(p.status) ? null : getDocumentDueDateCountdown(p.deadline, "open");
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="group flex items-center gap-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium text-foreground group-hover:underline">{p.title}</p>
                <ProjectStatusMark status={p.status} withLabel />
              </div>
              {due ? <span className={cn("shrink-0 text-meta", DUE_TONE[due.color])}>{due.label}</span> : null}
            </Link>
          );
        })
      )}
    </ClientSection>
  );
}
