"use client";

import Link from "next/link";
import { BookTemplate, MoreVertical, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { useTransition, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { formatProjectDate, projectStatusLabel } from "@/lib/projects/display";
import {
  isProjectAtRisk,
} from "@/lib/projects/project-utils";
import { computeTaskProgress } from "@/lib/projects/project-progress";
import { buildProjectRollup } from "@/lib/projects/project-rollups";
import { formatCurrency } from "@/lib/utils/format";
import { pinItem, unpinItem } from "@/lib/pinned/actions";
import { usePinnedItems } from "@/lib/pinned/context";
import { deleteProject } from "@/lib/projects/actions";
import type { ProjectListRow, ProjectMilestoneRow, TaskRow } from "@/types";

import { SaveProjectAsTemplateDialog } from "@/components/features/projects/save-project-as-template-dialog";

import { GradientAvatar } from "@/components/shared/gradient-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RecordHelp } from "@/lib/kraft/record-help";
import { KraftRecordHelp } from "@/components/features/ai-panel/kraft-record-help";

type ProjectSummaryCardProps = {
  project: ProjectListRow;
  milestones: ProjectMilestoneRow[];
  tasks: Pick<TaskRow, "status">[];
  expenses: Pick<{ amount: number }, "amount">[];
  currency: string;
  userDisplayName: string;
  /** What Kraft can help with on this project; its button sits beside the ⋯ menu. */
  kraftHelp?: RecordHelp | null;
};

function statusKeyForProject(
  status: ProjectListRow["status"],
): "active" | "planning" | "on_hold" | "done" {
  if (status === "active") return "active";
  if (status === "planning") return "planning";
  if (status === "on_hold") return "on_hold";
  if (status === "completed") return "done";
  return "on_hold";
}

export function ProjectActionsMenu({ project }: { project: ProjectListRow }) {
  const router = useRouter();
  const { isPinned } = usePinnedItems();
  const pinned = isPinned("project", project.id);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  const togglePin = () => {
    startTransition(async () => {
      const result = pinned
        ? await unpinItem("project", project.id)
        : await pinItem({
            itemType: "project",
            itemId: project.id,
            itemLabel: project.title,
            itemHref: `/projects/${project.id}`,
          });
      if (!result.ok) {
        toast.error(pinned ? "Failed to unpin" : "Failed to pin");
        return;
      }
      toast.success(pinned ? "Unpinned from sidebar" : "Pinned to sidebar");
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (!result.ok) {
        toast.error(result.message ?? "Failed to delete project");
        return;
      }
      setConfirmDelete(false);
      toast.success("Project deleted");
      router.push("/projects");
      router.refresh();
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 rounded-full"
              aria-label="Project actions"
              disabled={isPending}
            />
          }
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem render={<Link href={`/projects/${project.id}/edit`} />}>
            <Pencil className="mr-2 size-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={togglePin} disabled={isPending}>
            {pinned ? (
              <><PinOff className="mr-2 size-3.5" />Unpin from sidebar</>
            ) : (
              <><Pin className="mr-2 size-3.5" />Pin to sidebar</>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSaveAsTemplate(true)}>
            <BookTemplate className="mr-2 size-3.5" />
            Save as template
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="mr-2 size-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              &ldquo;{project.title}&rdquo;, its tasks, milestones, and time entries
              will be permanently deleted. Linked documents and expenses will be
              unlinked from this project. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SaveProjectAsTemplateDialog
        projectId={project.id}
        defaultName={project.title}
        open={saveAsTemplate}
        onOpenChange={setSaveAsTemplate}
      />
    </>
  );
}

export function ProjectSummaryCard({
  project,
  milestones,
  tasks,
  expenses,
  currency,
  userDisplayName,
  kraftHelp,
}: ProjectSummaryCardProps) {
  const kraft = kraftHelp ? <KraftRecordHelp help={kraftHelp} /> : null;
  const clientName = project.client?.name ?? "Client";
  const clientHref = project.client?.id
    ? `/clients/${project.client.id}`
    : "/clients";
  const deadlineLabel = formatProjectDate(project.deadline);
  const atRisk = isProjectAtRisk(project);
  const taskProgress = computeTaskProgress(tasks);
  const rollup = buildProjectRollup({
    project,
    tasks: [],
    expenses,
    timeEntries: [],
  });
  const budgetProgress = Math.round(rollup.budgetProgress * 100);
  const completedMilestones = milestones.filter(
    (milestone) => milestone.status === "completed",
  ).length;
  const budgetLabel =
    project.budget != null ? formatCurrency(project.budget, currency) : "—";

  return (
    <TooltipProvider delay={300}>
      <section className="fade-up delay-2 rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4 @4xl/shell:hidden">
          <div className="min-w-0">
            <h2 className="font-heading text-[22px] font-semibold tracking-[-0.02em] text-foreground">
              {project.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--fg-2)]">
              For{" "}
              <Link
                href={clientHref}
                className="font-medium text-[var(--fg-2)] underline-offset-4 hover:underline"
              >
                {clientName}
              </Link>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {kraft}
            <ProjectActionsMenu project={project} />
          </div>
        </div>

        <div
          className={cn(
            "mt-5 grid grid-cols-2 gap-4",
            "sm:grid-cols-3",
            "@4xl/shell:mt-0 @4xl/shell:grid-cols-[minmax(0,1.45fr)_repeat(6,minmax(0,1fr))_auto] @4xl/shell:items-center @4xl/shell:gap-5",
          )}
        >
          <div className="hidden min-w-0 @4xl/shell:block">
            <h2 className="font-heading text-[22px] font-semibold tracking-[-0.02em] text-foreground">
              {project.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--fg-2)]">
              For{" "}
              <Link
                href={clientHref}
                className="font-medium text-[var(--fg-2)] underline-offset-4 hover:underline"
              >
                {clientName}
              </Link>
            </p>
          </div>

          <ProjectSummaryMetric label="Status">
            {project.status === "archived" ? (
              <Badge variant="outline">{projectStatusLabel("archived")}</Badge>
            ) : (
              <StatusBadge status={statusKeyForProject(project.status)} dot />
            )}
          </ProjectSummaryMetric>

          <ProjectSummaryMetric label="Deadline">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-medium tabular-nums">{deadlineLabel}</p>
              {atRisk ? (
                <Badge variant="danger" className="text-[10px]">
                  At risk
                </Badge>
              ) : null}
            </div>
          </ProjectSummaryMetric>

          <ProjectSummaryMetric label="Tasks">
            {taskProgress.total > 0 ? (
              <>
                <p className="text-sm font-semibold tabular-nums">
                  {taskProgress.done}/{taskProgress.total}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--fg-3)] tabular-nums">
                  {taskProgress.percent}% done
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--fg-3)]">—</p>
            )}
          </ProjectSummaryMetric>

          <ProjectSummaryMetric label="Budget">
            <p className="text-sm font-semibold tabular-nums">{budgetLabel}</p>
            {project.budget != null ? (
              <p className="mt-0.5 text-[11px] text-[var(--fg-3)] tabular-nums">
                {budgetProgress}% spent
              </p>
            ) : null}
          </ProjectSummaryMetric>

          <ProjectSummaryMetric label="Milestones">
            <p className="text-sm font-semibold tabular-nums">
              {completedMilestones}/{milestones.length}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--fg-3)]">
              complete
            </p>
          </ProjectSummaryMetric>

          <ProjectSummaryMetric label="Team">
            <div className="flex items-center gap-2">
              <GradientAvatar name={userDisplayName} size={26} />
              <p className="text-[11px] text-[var(--fg-3)]">You only</p>
            </div>
          </ProjectSummaryMetric>

          <div className="hidden items-center justify-center gap-2 border-s border-border/60 ps-5 @4xl/shell:flex">
            {kraft}
            <ProjectActionsMenu project={project} />
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}

function ProjectSummaryMetric({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-[var(--bg-subtle)] p-3 @4xl/shell:bg-transparent @4xl/shell:p-0">
      <p className="eyebrow mb-1.5">{label}</p>
      {children}
    </div>
  );
}
