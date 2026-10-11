"use client";

import { CalendarDays, MoreHorizontal, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createProjectMilestone,
  deleteProjectMilestone,
  updateProjectMilestone,
} from "@/lib/projects/milestone-actions";
import { updateTask } from "@/lib/tasks/actions";
import type { ProjectMilestoneRow, ProjectMilestoneStatus, TaskRow } from "@/types";

import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { FormDatePicker } from "@/components/shared/form-date-picker";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ProjectTimelinePanelProps = {
  projectId: string;
  milestones: ProjectMilestoneRow[];
  tasks: TaskRow[];
};

const STATUS_OPTIONS: { value: ProjectMilestoneStatus; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDate(date: string | null): string {
  if (!date) return "No due date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

export function ProjectTimelinePanel({
  projectId,
  milestones,
  tasks,
}: ProjectTimelinePanelProps) {
  const router = useRouter();
  const [items, setItems] = useState(milestones);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setItems(milestones);
  }, [projectId, milestones]);

  const tasksByMilestone = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    for (const task of tasks) {
      if (!task.milestone_id) continue;
      const current = map.get(task.milestone_id) ?? [];
      current.push(task);
      map.set(task.milestone_id, current);
    }
    return map;
  }, [tasks]);

  const unassignedTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.milestone_id === null && t.parent_task_id === null,
      ),
    [tasks],
  );

  function refresh() {
    router.refresh();
  }

  function addMilestone() {
    const trimmed = title.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await createProjectMilestone(projectId, {
        title: trimmed,
        description: "",
        status: "upcoming",
        due_date: dueDate,
        sort_order: items.length,
        client_visible: false,
      });

      if (!result.ok) {
        toast.error(result.message ?? "Failed to add milestone.");
        return;
      }

      setItems((prev) => [...prev, result.milestone]);
      setTitle("");
      setDueDate("");
      toast.success("Milestone added");
      refresh();
    });
  }

  function startEdit(milestone: ProjectMilestoneRow) {
    setEditingId(milestone.id);
    setEditTitle(milestone.title);
    setEditDueDate(milestone.due_date ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditDueDate("");
  }

  function saveEdit(milestoneId: string) {
    const trimmed = editTitle.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await updateProjectMilestone(projectId, milestoneId, {
        title: trimmed,
        due_date: editDueDate,
      });
      if (!result.ok) {
        toast.error(result.message ?? "Failed to update milestone.");
        return;
      }
      setItems((prev) =>
        prev.map((m) => (m.id === milestoneId ? result.milestone : m)),
      );
      cancelEdit();
      toast.success("Milestone updated");
      refresh();
    });
  }

  function changeStatus(milestoneId: string, status: ProjectMilestoneStatus) {
    startTransition(async () => {
      const result = await updateProjectMilestone(projectId, milestoneId, {
        status,
      });
      if (!result.ok) {
        toast.error(result.message ?? "Failed to update milestone.");
        return;
      }
      setItems((prev) =>
        prev.map((m) => (m.id === milestoneId ? result.milestone : m)),
      );
      toast.success("Status updated");
      refresh();
    });
  }

  function confirmRemoveMilestone() {
    if (!confirmDeleteId) return;
    const milestoneId = confirmDeleteId;
    startTransition(async () => {
      const result = await deleteProjectMilestone(projectId, milestoneId);
      if (!result.ok) {
        toast.error(result.message ?? "Failed to delete milestone.");
        return;
      }
      setItems((prev) => prev.filter((m) => m.id !== milestoneId));
      setConfirmDeleteId(null);
      toast.success("Milestone deleted");
      refresh();
    });
  }

  function assignTask(taskId: string, milestoneId: string) {
    startTransition(async () => {
      const result = await updateTask(projectId, taskId, {
        milestone_id: milestoneId,
      });
      if (!result.ok) {
        toast.error(result.message ?? "Failed to assign task.");
        return;
      }
      toast.success("Task assigned");
      refresh();
    });
  }

  function unassignTask(taskId: string) {
    startTransition(async () => {
      const result = await updateTask(projectId, taskId, { milestone_id: null });
      if (!result.ok) {
        toast.error(result.message ?? "Failed to unassign task.");
        return;
      }
      toast.success("Task unassigned");
      refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="grid gap-3 @xl/shell:grid-cols-[minmax(0,1fr)_180px_auto] @xl/shell:items-end">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="milestone-title">Milestone</Label>
            <Input
              id="milestone-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Design approval"
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="milestone-due">Due date</Label>
            <FormDatePicker
              id="milestone-due"
              value={dueDate}
              onChange={setDueDate}
              placeholder="Optional"
              disabled={isPending}
            />
          </div>
          <Button
            type="button"
            onClick={addMilestone}
            disabled={isPending || !title.trim()}
          >
            <Plus />
            Add milestone
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyStateCard
          icon={CalendarDays}
          title="No milestones yet"
          description="Add delivery checkpoints to turn this project into a simple timeline."
        />
      ) : (
        <div className="relative flex flex-col gap-3 before:absolute before:left-4 before:top-4 before:h-[calc(100%-2rem)] before:w-px before:bg-border">
          {items.map((milestone) => {
            const milestoneTasks = tasksByMilestone.get(milestone.id) ?? [];
            const doneTasks = milestoneTasks.filter(
              (task) => task.status === "done",
            );
            const progress =
              milestoneTasks.length === 0
                ? 0
                : Math.round((doneTasks.length / milestoneTasks.length) * 100);
            const isEditing = editingId === milestone.id;
            const assignable = unassignedTasks.filter(
              (t) => !milestoneTasks.some((mt) => mt.id === t.id),
            );

            return (
              <article
                key={milestone.id}
                className="relative ml-8 rounded-xl border border-border bg-card p-4 shadow-xs"
              >
                <span
                  className="absolute -left-[1.85rem] top-5 size-3 rounded-full border-2 border-background bg-primary"
                  aria-hidden
                />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {isEditing ? (
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        disabled={isPending}
                        aria-label="Milestone title"
                      />
                      <FormDatePicker
                        value={editDueDate}
                        onChange={setEditDueDate}
                        placeholder="Optional"
                        disabled={isPending}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => saveEdit(milestone.id)}
                          disabled={isPending || !editTitle.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                          disabled={isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium">{milestone.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(milestone.due_date)}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={milestone.status} dot />
                    {milestone.client_visible ? (
                      <Badge variant="outline">Portal</Badge>
                    ) : null}
                    {!isEditing ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${milestone.title}`}
                            >
                              <MoreHorizontal />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => startEdit(milestone)}>
                            Edit
                          </DropdownMenuItem>
                          {STATUS_OPTIONS.map((opt) => (
                            <DropdownMenuItem
                              key={opt.value}
                              disabled={milestone.status === opt.value}
                              onClick={() =>
                                changeStatus(milestone.id, opt.value)
                              }
                            >
                              Mark {opt.label.toLowerCase()}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setConfirmDeleteId(milestone.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </div>
                {milestone.description && !isEditing ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {milestone.description}
                  </p>
                ) : null}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {doneTasks.length}/{milestoneTasks.length} tasks complete
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <progress
                    value={progress}
                    max={100}
                    className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary"
                  />
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Linked tasks
                  </p>
                  {milestoneTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No tasks linked yet.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {milestoneTasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <StatusBadge status={task.status} dot />
                            <span
                              className={cn(
                                "truncate text-sm",
                                task.status === "done" &&
                                  "text-muted-foreground line-through",
                              )}
                            >
                              {task.title}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => unassignTask(task.id)}
                            disabled={isPending}
                            aria-label={`Unassign ${task.title}`}
                          >
                            <X className="size-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {assignable.length > 0 ? (
                    <Select
                      onValueChange={(taskId) => {
                        if (typeof taskId === "string" && taskId) {
                          assignTask(taskId, milestone.id);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Assign a task…" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignable.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete milestone?</DialogTitle>
            <DialogDescription>
              This milestone will be permanently deleted. Linked tasks will be
              unassigned. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteId(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmRemoveMilestone}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
