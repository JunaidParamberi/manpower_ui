"use client";

import { AlertCircle, BriefcaseBusiness, CalendarDays, CheckCircle2, Wallet } from "lucide-react";

import type { ProjectFormInsights } from "@/lib/projects/project-form-insights";

import { WorkspaceInsightCard } from "@/components/shared/workspace-form-shell";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";

type ProjectWorkspacePanelProps = {
  insights: ProjectFormInsights;
  mode: "create" | "edit";
};

export function ProjectWorkspacePanel({
  insights,
  mode,
}: ProjectWorkspacePanelProps) {
  const ready = insights.missingEssentials.length === 0;

  return (
    <>
      <WorkspaceInsightCard
        title="Project launch preview"
        description="A quick read on what will be created or changed."
        action={<Badge variant={ready ? "accent" : "outline"}>{mode === "create" ? "Draft" : "Editing"}</Badge>}
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="font-heading text-lg font-semibold tracking-tight">
              {insights.title}
            </p>
            <p className="text-sm text-muted-foreground">{insights.clientLabel}</p>
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-start gap-2">
              <BriefcaseBusiness
                className="mt-0.5 size-4 text-muted-foreground"
                strokeWidth={1.6}
              />
              <div>
                <p className="font-medium">Status</p>
                <p className="text-muted-foreground">{insights.statusLabel}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Wallet className="mt-0.5 size-4 text-muted-foreground" strokeWidth={1.6} />
              <div>
                <p className="font-medium">Budget</p>
                <p className="text-muted-foreground">
                  {insights.budgetLabel} · {insights.spentLabel}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays
                className="mt-0.5 size-4 text-muted-foreground"
                strokeWidth={1.6}
              />
              <div>
                <p className="font-medium">Timeline</p>
                <p className="text-muted-foreground">{insights.timelineLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </WorkspaceInsightCard>

      <WorkspaceInsightCard title="Budget snapshot">
        <Progress value={insights.budgetProgressPercent}>
          <ProgressLabel>Budget used</ProgressLabel>
          <ProgressValue>{() => `${insights.budgetProgressPercent}%`}</ProgressValue>
        </Progress>
      </WorkspaceInsightCard>

      <WorkspaceInsightCard title={ready ? "Next action" : "Before you save"}>
        {ready ? (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 size-4 text-[var(--success)]" strokeWidth={1.6} />
            <p>{insights.nextActionLabel}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {insights.missingEssentials.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={1.6} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </WorkspaceInsightCard>
    </>
  );
}
