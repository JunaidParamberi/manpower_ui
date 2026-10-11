"use client";

import { BookTemplate, FolderKanban } from "lucide-react";
import type { ReactNode } from "react";

import {
  projectTemplateCountsLabel,
} from "@/lib/projects/template-display";
import { cn } from "@/lib/utils";
import type { ProjectTemplateSummaryRow } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ProjectTemplateSectionHeading({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      <span className="text-foreground/70">{icon}</span>
      {children}
    </div>
  );
}

export function ProjectBlankCard({
  selected,
  onClick,
  disabled,
}: {
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex aspect-[5/4] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center transition",
        "hover:border-foreground/40 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60",
        selected && "border-foreground/40 ring-2 ring-foreground/10",
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground transition group-hover:bg-foreground group-hover:text-background">
        <FolderKanban className="size-5" />
      </span>
      <span className="text-sm font-medium">Blank project</span>
      <span className="text-xs text-muted-foreground">Start without a template</span>
    </button>
  );
}

type ProjectTemplateCardProps = {
  template: ProjectTemplateSummaryRow;
  selected?: boolean;
  onSelect: () => void;
  footerActions?: ReactNode;
  disabled?: boolean;
};

export function ProjectTemplateCard({
  template,
  selected,
  onSelect,
  footerActions,
  disabled,
}: ProjectTemplateCardProps) {
  const countsLabel = projectTemplateCountsLabel(
    template.milestone_count,
    template.task_count,
  );

  return (
    <div
      className={cn(
        "group relative flex aspect-[5/4] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition hover:border-foreground/40 hover:shadow-md",
        selected && "border-foreground/40 ring-2 ring-foreground/10",
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        className="flex flex-1 flex-col items-stretch text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="relative flex-1 overflow-hidden bg-gradient-to-b from-muted/40 to-card px-5 pt-5 pb-3">
          <div className="font-heading line-clamp-2 text-[0.95rem] font-semibold tracking-tight text-foreground/90">
            {template.name}
          </div>
          <p className="mt-2 line-clamp-4 text-[0.65rem] leading-relaxed text-muted-foreground/80">
            {template.description ?? "Reusable milestones and tasks for new projects."}
          </p>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent"
          />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-background/60 px-4 py-3">
          <span className="flex items-center gap-2 text-xs text-foreground/80">
            <BookTemplate className="size-3.5 text-muted-foreground" />
            {countsLabel}
          </span>
          {template.is_system ? (
            <Badge variant="outline" className="font-normal text-[0.65rem]">
              System
            </Badge>
          ) : null}
        </div>
      </button>
      {footerActions ? (
        <div className="border-t border-border/60 bg-background/60 px-4 py-2">
          {footerActions}
        </div>
      ) : null}
    </div>
  );
}

export function ProjectTemplateUseButton({
  onClick,
  disabled,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("w-full", className)}
      disabled={disabled}
      onClick={onClick}
    >
      Use template
    </Button>
  );
}
