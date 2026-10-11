"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal, PenLine, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";

import {
  formatTaskDueDisplay,
  taskPriorityStatusKey,
} from "@/lib/tasks/display";
import { deleteTask, updateTask } from "@/lib/tasks/actions";
import { pinItem, unpinItem } from "@/lib/pinned/actions";
import { isTaskOverdue, taskStatusChange } from "@/lib/tasks/task-utils";
import type { TaskListRow } from "@/types";

import { PinContextMenu } from "@/components/shared/pin-context-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { usePinnedItems } from "@/lib/pinned/context";
import { useAgentGlow } from "@/lib/ai-panel/agent-activity-context";
import { cn } from "@/lib/utils";

type TaskRowProps = {
  task: TaskListRow;
  subtasks?: TaskListRow[];
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onEdit?: (task: TaskListRow) => void;
};

export function TaskRow({
  task,
  subtasks = [],
  isSelected = false,
  onToggleSelect,
  onEdit,
}: TaskRowProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const glow = useAgentGlow("tasks", task.id);
  const [isPending, startTransition] = useTransition();
  const { isPinned } = usePinnedItems();
  const pinned = isPinned("task", task.id);
  const hasSubtasks = subtasks.length > 0;

  const togglePin = () => {
    startTransition(async () => {
      const result = pinned
        ? await unpinItem("task", task.id)
        : await pinItem({
            itemType: "task",
            itemId: task.id,
            itemLabel: task.title,
            itemHref: `/projects/${task.project.id}`,
          });
      if (!result.ok) {
        toast.error(pinned ? "Failed to unpin" : "Failed to pin");
        return;
      }
      toast.success(pinned ? "Unpinned from sidebar" : "Pinned to sidebar");
    });
  };

  const isDone = task.status === "done";
  const overdue = isTaskOverdue(task);
  const due = formatTaskDueDisplay(task);

  function refresh() {
    router.refresh();
  }

  function toggleDone() {
    startTransition(async () => {
      const next = task.status === "done" ? "todo" : "done";
      const res = await updateTask(task.project_id, task.id, taskStatusChange(next));
      if (!res.ok) {
        toast.error(res.message ?? "Failed to update task.");
        return;
      }
      refresh();
    });
  }

  function removeTask() {
    startTransition(async () => {
      const res = await deleteTask(task.project_id, task.id);
      if (!res.ok) {
        toast.error(res.message ?? "Failed to delete task.");
        return;
      }
      toast.success("Task deleted");
      refresh();
    });
  }

  return (
    <>
    <PinContextMenu
      itemType="task"
      itemId={task.id}
      itemLabel={task.title}
      itemHref={`/projects/${task.project_id}`}
      isPinned={isPinned("task", task.id)}
    >
    <TableRow
      className={cn(
        "tasks-table-row border-b border-border",
        overdue &&
          "bg-[color-mix(in_srgb,var(--danger)_6%,transparent)] hover:bg-[color-mix(in_srgb,var(--danger)_8%,transparent)]",
        isSelected && "bg-muted/50",
        glow && "agent-glow",
      )}
      data-state={isDone ? "done" : undefined}
    >
      {onToggleSelect !== undefined ? (
        <TableCell className="tasks-table-cell w-8 pe-0 ps-[14px]">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            aria-label={`Select ${task.title}`}
            className="translate-y-px"
          />
        </TableCell>
      ) : null}
      <TableCell className="tasks-table-cell w-10 pe-0">
        <Checkbox
          checked={isDone}
          disabled={isPending}
          onCheckedChange={toggleDone}
          aria-label={
            isDone ? "Mark task as not done" : "Mark task as done"
          }
        />
      </TableCell>
      <TableCell className="tasks-table-cell min-w-[12rem] whitespace-normal">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-1.5">
            {hasSubtasks ? (
              <button
                type="button"
                className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={(event) => {
                  event.stopPropagation();
                  setExpanded((value) => !value);
                }}
                aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
                aria-expanded={expanded}
              >
                {expanded ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
              </button>
            ) : null}
            <button
              type="button"
              className={cn(
                "text-left text-sm font-medium leading-snug hover:underline",
                isDone && "text-muted-foreground line-through",
              )}
              onClick={() => onEdit?.(task)}
              disabled={!onEdit}
            >
              {task.title}
            </button>
            {hasSubtasks ? (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                {subtasks.length}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 md:hidden">
            <Link
              href={`/projects/${task.project.id}`}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {task.project.title}
            </Link>
            <StatusBadge status={task.status} dot />
            <StatusBadge status={taskPriorityStatusKey(task.priority)} dot />
            <span className={cn("text-xs tabular-nums", due.className)}>
              {due.label}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="tasks-table-cell hidden min-w-[10rem] whitespace-normal md:table-cell">
        <Link
          href={`/projects/${task.project.id}`}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {task.project.title}
        </Link>
      </TableCell>
      <TableCell className="tasks-table-cell hidden sm:table-cell">
        <StatusBadge status={task.status} dot />
      </TableCell>
      <TableCell className="tasks-table-cell hidden sm:table-cell">
        <StatusBadge status={taskPriorityStatusKey(task.priority)} dot />
      </TableCell>
      <TableCell
        className={cn(
          "tasks-table-cell hidden text-sm lg:table-cell",
          due.className,
        )}
      >
        {due.label}
      </TableCell>
      <TableCell className="tasks-table-cell text-end">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${task.title}`}
              >
                <MoreHorizontal data-icon="inline-start" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-44">
            {onEdit ? (
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <PenLine className="mr-2 size-3.5" />
                Edit task
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem render={<Link href={`/projects/${task.project.id}`} />}>
              View project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={togglePin} disabled={isPending}>
              {pinned ? (
                <><PinOff className="mr-2 size-3.5" />Unpin from sidebar</>
              ) : (
                <><Pin className="mr-2 size-3.5" />Pin to sidebar</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={removeTask}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
    </PinContextMenu>
    {expanded
      ? subtasks.map((subtask) => (
          <SubtaskRow key={subtask.id} task={subtask} onEdit={onEdit} />
        ))
      : null}
    </>
  );
}

type SubtaskRowProps = {
  task: TaskListRow;
  onEdit?: (task: TaskListRow) => void;
};

function SubtaskRow({ task, onEdit }: SubtaskRowProps) {
  const isDone = task.status === "done";
  const due = formatTaskDueDisplay(task);

  return (
    <TableRow className="tasks-table-row border-b border-border bg-muted/20">
      <TableCell className="tasks-table-cell w-8 pe-0 ps-[14px]" />
      <TableCell className="tasks-table-cell w-10 pe-0" />
      <TableCell className="tasks-table-cell min-w-[12rem] whitespace-normal">
        <button
          type="button"
          className={cn(
            "ps-6 text-left text-sm leading-snug text-muted-foreground hover:underline",
            isDone && "line-through",
          )}
          onClick={() => onEdit?.(task)}
          disabled={!onEdit}
        >
          {task.title}
        </button>
      </TableCell>
      <TableCell className="tasks-table-cell hidden md:table-cell" />
      <TableCell className="tasks-table-cell hidden sm:table-cell">
        <StatusBadge status={task.status} dot />
      </TableCell>
      <TableCell className="tasks-table-cell hidden sm:table-cell">
        <StatusBadge status={taskPriorityStatusKey(task.priority)} dot />
      </TableCell>
      <TableCell
        className={cn(
          "tasks-table-cell hidden text-sm lg:table-cell",
          due.className,
        )}
      >
        {due.label}
      </TableCell>
      <TableCell className="tasks-table-cell" />
    </TableRow>
  );
}
