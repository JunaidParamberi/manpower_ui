// components/features/dashboard/work-card.tsx

import { Badge } from "@/components/ui/badge";
import {
  PanelCard,
  PanelCardBody,
  PanelCardHeader,
  PanelCardList,
  PanelCardRow,
} from "@/components/shared/panel-card";
import type { WorkFacts } from "@/lib/dashboard/snapshot-types";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

type WorkCardProps = {
  work: WorkFacts;
  /** Project budgets carry no currency column — they use the profile's. */
  currency: string;
};

const RISK_DOT: Record<string, string> = {
  overdue: "bg-[var(--danger)]",
  at_risk: "bg-[var(--danger)]",
  watch: "bg-[var(--warning)]",
  on_track: "bg-[var(--fg-3)]",
};

const STAGE_LABEL = {
  draft: "Draft",
  awaiting_reply: "Awaiting reply",
  awaiting_invoice: "Ready to invoice",
} as const;

export function WorkCard({ work, currency }: WorkCardProps) {
  const isProjects = work.kind === "projects";
  const isEmpty = isProjects ? work.projects.length === 0 : work.documents.length === 0;

  return (
    <PanelCard>
      <PanelCardHeader
        title={isProjects ? "Active work" : "Documents in flight"}
        meta={<span className="tabular-nums">{work.totalCount}</span>}
      />
      {isEmpty ? (
        <PanelCardBody>
          <p className="text-body text-muted-foreground">
            {isProjects ? "No active projects." : "Nothing in flight — every document is either paid or closed."}
          </p>
        </PanelCardBody>
      ) : (
        <PanelCardList>
          {work.kind === "projects"
            ? work.projects.map((project) => (
                <PanelCardRow key={project.id} href={`/projects/${project.id}`} className="items-start">
                  <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", RISK_DOT[project.risk])} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-medium text-foreground">{project.title}</span>
                    <span className="truncate text-meta text-[var(--fg-3)]">
                      {project.daysLabel}
                      {project.budget
                        ? ` · ${formatCurrency(project.spent, currency)} of ${formatCurrency(project.budget, currency)}`
                        : ""}
                    </span>
                    {project.budget ? (
                      <div className="mt-0.5 h-[3px] overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                        <div
                          className="h-full rounded-full bg-[var(--border-focus)]"
                          style={{ width: `${Math.round((project.progress ?? 0) * 100)}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                </PanelCardRow>
              ))
            : work.documents.map((document) => (
                <PanelCardRow key={document.id} href={`/documents/${document.id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{document.title}</p>
                    <p className="text-meta text-[var(--fg-3)]">
                      {document.clientName ? `${document.clientName} · ` : ""}
                      {document.ageDays}d
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 rounded-full font-normal">
                    {STAGE_LABEL[document.stage]}
                  </Badge>
                </PanelCardRow>
              ))}
        </PanelCardList>
      )}
    </PanelCard>
  );
}