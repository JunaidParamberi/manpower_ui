"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  CheckIcon,
  Circle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { listProjectMilestones } from "@/lib/projects/milestone-actions";
import {
  createTask,
  createTaskComment,
  deleteTask,
  listTaskComments,
  updateTask,
} from "@/lib/tasks/actions";
import { taskPriorityLabel } from "@/lib/tasks/display";
import { taskStatusChange } from "@/lib/tasks/task-utils";
import { cn } from "@/lib/utils";
import {
  TASK_LIMITS,
  taskEditFormSchema,
  type TaskEditFormValues,
} from "@/lib/validations/task";
import type {
  ProjectListRow,
  ProjectMilestoneRow,
  TaskCommentRow,
  TaskPriority,
  TaskRow,
  TaskStatus,
} from "@/types";

import { FormDatePicker } from "@/components/shared/form-date-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/shared/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const PRIORITIES = ["low", "medium", "high"] as const;

type StatusConfig = {
  status: TaskStatus;
  label: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  dot: string;
};

const STATUS_CONFIG: StatusConfig[] = [
  {
    status: "todo",
    label: "To Do",
    activeBg: "bg-[color-mix(in_srgb,var(--fg-3)_12%,transparent)]",
    activeBorder: "border-[color-mix(in_srgb,var(--fg-3)_35%,transparent)]",
    activeText: "text-[var(--fg-2)]",
    dot: "bg-[var(--fg-3)]",
  },
  {
    status: "in_progress",
    label: "In Progress",
    activeBg: "bg-[color-mix(in_srgb,var(--border-focus)_8%,transparent)]",
    activeBorder: "border-[color-mix(in_srgb,var(--border-focus)_40%,transparent)]",
    activeText: "text-[var(--border-focus)]",
    dot: "bg-[var(--border-focus)]",
  },
  {
    status: "done",
    label: "Done",
    activeBg: "bg-[color-mix(in_srgb,var(--success)_8%,transparent)]",
    activeBorder: "border-[color-mix(in_srgb,var(--success)_40%,transparent)]",
    activeText: "text-[var(--success)]",
    dot: "bg-[var(--success)]",
  },
  {
    status: "cancelled",
    label: "Cancelled",
    activeBg: "bg-[color-mix(in_srgb,var(--danger)_8%,transparent)]",
    activeBorder: "border-[color-mix(in_srgb,var(--danger)_40%,transparent)]",
    activeText: "text-[var(--danger)]",
    dot: "bg-[var(--danger)]",
  },
];

function formatCommentTimestamp(iso: string): string {
  const parsed = parseISO(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return format(parsed, "MMM d, yyyy 'at' h:mm a");
}

function buildCreateDefaults(status: TaskStatus): TaskEditFormValues {
  return {
    title: "",
    status,
    priority: "medium",
    due_date: "",
    description: "",
    start_date: "",
    completed_at: "",
    estimated_minutes: "",
    sort_order: 0,
    client_visible: false,
    parent_task_id: null,
    milestone_id: null,
    labels: [],
  };
}

type TaskEditSheetProps = {
  task: TaskRow | null;
  allTasks: TaskRow[];
  projectId: string;
  open: boolean;
  onClose: () => void;
  onSaved: (task: TaskRow) => void;
  onDeleted: (taskId: string) => void;
  onCreated: (task: TaskRow) => void;
  /** Initial status when opening the sheet to create a task (e.g. from a kanban column). */
  defaultStatus?: TaskStatus;
  /** When set, show a project picker in create mode (global /tasks inbox). */
  projects?: ProjectListRow[];
  defaultProjectId?: string | null;
};

export function TaskEditSheet({
  task,
  allTasks,
  projectId,
  open,
  onClose,
  onSaved,
  onDeleted,
  onCreated,
  defaultStatus = "todo",
  projects,
  defaultProjectId,
}: TaskEditSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [labelInput, setLabelInput] = useState("");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [commentClientVisible, setCommentClientVisible] = useState(false);
  const [comments, setComments] = useState<TaskCommentRow[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestoneRow[]>([]);
  const [createProjectId, setCreateProjectId] = useState("");

  const isCreateMode = open && task === null;
  const effectiveProjectId =
    task?.project_id ?? (projects ? createProjectId : projectId);

  const form = useForm<TaskEditFormValues>({
    resolver: zodResolver(taskEditFormSchema),
    defaultValues: buildCreateDefaults(defaultStatus),
    values: task
      ? {
          title: task.title,
          status: task.status,
          priority: task.priority,
          due_date: task.due_date ?? "",
          description: task.description ?? "",
          start_date: task.start_date ?? "",
          completed_at: task.completed_at ?? "",
          estimated_minutes: task.estimated_minutes ?? "",
          sort_order: task.sort_order,
          client_visible: task.client_visible,
          parent_task_id: task.parent_task_id,
          milestone_id: task.milestone_id,
          labels: task.labels ?? [],
        }
      : undefined,
  });

  const labels = form.watch("labels") ?? [];
  const milestoneId = form.watch("milestone_id");
  const clientVisible = form.watch("client_visible") ?? false;
  const currentStatus = form.watch("status");
  const subtasks = task ? allTasks.filter((t) => t.parent_task_id === task.id) : [];
  const doneSubtasks = subtasks.filter((t) => t.status === "done").length;

  useEffect(() => {
    if (!open) return;
    if (!task) {
      form.reset(buildCreateDefaults(defaultStatus));
      setCreateProjectId(defaultProjectId ?? projectId ?? "");
      setLabelInput("");
      setSubtaskTitle("");
      setCommentBody("");
      setCommentClientVisible(false);
      setComments([]);
    }
  }, [open, task, defaultStatus, defaultProjectId, projectId, form]);

  useEffect(() => {
    if (!open) {
      setComments([]);
      setMilestones([]);
      return;
    }
    if (!effectiveProjectId) {
      setMilestones([]);
      return;
    }

    let cancelled = false;

    if (task) {
      void listTaskComments(effectiveProjectId, task.id).then((result) => {
        if (!cancelled && result.ok) setComments(result.comments);
      });
    } else {
      setComments([]);
    }

    void listProjectMilestones(effectiveProjectId).then((result) => {
      if (!cancelled && result.ok) setMilestones(result.milestones);
    });

    return () => {
      cancelled = true;
    };
  }, [open, effectiveProjectId, task]);

  function addLabel() {
    const next = labelInput.trim();
    if (!next || labels.length >= TASK_LIMITS.labelsMax) return;
    if (labels.includes(next)) {
      setLabelInput("");
      return;
    }
    form.setValue("labels", [...labels, next]);
    setLabelInput("");
  }

  function removeLabel(label: string) {
    form.setValue("labels", labels.filter((l) => l !== label));
  }

  function addSubtask() {
    if (!task) return;
    const title = subtaskTitle.trim();
    if (!title) return;
    startTransition(async () => {
      const res = await createTask(effectiveProjectId, {
        title,
        status: "todo",
        priority: task.priority,
        due_date: "",
        labels: [],
        parent_task_id: task.id,
        sort_order: subtasks.length,
      });
      if (!res.ok) {
        toast.error(res.message ?? "Failed to add subtask.");
        return;
      }
      toast.success("Subtask added");
      setSubtaskTitle("");
      onCreated(res.task);
    });
  }

  function toggleSubtask(subtask: TaskRow) {
    const nextStatus: TaskStatus = subtask.status === "done" ? "todo" : "done";
    startTransition(async () => {
      const res = await updateTask(
        effectiveProjectId,
        subtask.id,
        taskStatusChange(nextStatus),
      );
      if (!res.ok) {
        toast.error(res.message ?? "Failed to update subtask.");
        return;
      }
      onSaved(res.task);
    });
  }

  function submitComment() {
    if (!task) return;
    const body = commentBody.trim();
    if (!body) return;
    startTransition(async () => {
      const res = await createTaskComment(effectiveProjectId, task.id, {
        body,
        client_visible: commentClientVisible,
      });
      if (!res.ok) {
        toast.error(res.message ?? "Failed to add comment.");
        return;
      }
      setComments((prev) => [...prev, res.comment]);
      setCommentBody("");
      setCommentClientVisible(false);
      toast.success("Comment added");
    });
  }

  function onSubmit(data: TaskEditFormValues) {
    if (isCreateMode) {
      if (!effectiveProjectId) {
        toast.error("Choose a project for this task.");
        return;
      }
      startTransition(async () => {
        const statusFields = taskStatusChange(data.status);
        const res = await createTask(effectiveProjectId, {
          ...data,
          status: statusFields.status,
          completed_at: statusFields.completed_at ?? "",
        });
        if (!res.ok) {
          toast.error(res.message ?? "Failed to add task.");
          return;
        }
        toast.success("Task added");
        onCreated(res.task);
        onClose();
        router.refresh();
      });
      return;
    }

    if (!task) return;
    startTransition(async () => {
      const res = await updateTask(effectiveProjectId, task.id, data);
      if (!res.ok) {
        toast.error(res.message ?? "Failed to update task.");
        return;
      }
      toast.success("Task updated");
      onSaved(res.task);
      onClose();
      router.refresh();
    });
  }

  function onDelete() {
    if (!task) return;
    if (!window.confirm("Delete this task?")) return;
    startTransition(async () => {
      const res = await deleteTask(effectiveProjectId, task.id);
      if (!res.ok) {
        toast.error(res.message ?? "Failed to delete task.");
        return;
      }
      toast.success("Task deleted");
      onDeleted(task.id);
      onClose();
      router.refresh();
    });
  }

  function handleMoveTo(s: TaskStatus) {
    if (!task) return;
    startTransition(async () => {
      const res = await updateTask(effectiveProjectId, task.id, taskStatusChange(s));
      if (!res.ok) {
        toast.error(res.message ?? "Failed to update task.");
        return;
      }
      const cfg = STATUS_CONFIG.find((c) => c.status === s);
      toast.success(`Moved to ${cfg?.label ?? s}`);
      onSaved(res.task);
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isCreateMode ? "New task" : "Edit task"}</DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? "Capture what needs doing — you can refine details anytime."
              : "Update task details, status, and notes."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 pt-1">
          {/* Project picker — create mode in /tasks inbox only */}
          {isCreateMode && projects && projects.length > 0 ? (
            <>
              <section className="flex flex-col gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Project
                </p>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="task-project">Project *</Label>
                  <Select
                    value={createProjectId || undefined}
                    onValueChange={(v) => {
                      if (typeof v === "string") setCreateProjectId(v);
                    }}
                  >
                    <SelectTrigger id="task-project" className="w-full">
                      <SelectValue placeholder="Select a project">
                        {createProjectId
                          ? projects.find((p) => p.id === createProjectId)?.title
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>
              <Separator />
            </>
          ) : null}

          {/* Status */}
          <section className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {isCreateMode ? "Status" : "Move to"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_CONFIG.map(({ status: s, label, activeBg, activeBorder, activeText, dot }) => {
                const isCurrent = isCreateMode ? currentStatus === s : task?.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!isCreateMode && (Boolean(isCurrent) || isPending)}
                    onClick={() => {
                      if (isCreateMode) {
                        form.setValue("status", s);
                      } else if (task && !isCurrent) {
                        handleMoveTo(s);
                      }
                    }}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all duration-150",
                      isCurrent
                        ? cn("cursor-default", activeBg, activeBorder, activeText)
                        : "border-border bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        isCurrent
                          ? dot
                          : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50",
                      )}
                    />
                    <span className="flex-1 truncate">{label}</span>
                    {isCurrent ? (
                      <CheckIcon className="ml-auto size-3.5 shrink-0 opacity-70" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* Details */}
          <section className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Details
            </p>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                maxLength={TASK_LIMITS.title}
                placeholder="What needs to get done?"
                {...form.register("title")}
              />
              {form.formState.errors.title ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-priority">Priority</Label>
                <Select
                  value={form.watch("priority")}
                  onValueChange={(v) => form.setValue("priority", v as TaskPriority)}
                >
                  <SelectTrigger id="task-priority" className="w-full">
                    <SelectValue>{taskPriorityLabel(form.watch("priority"))}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {taskPriorityLabel(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {milestones.length > 0 && effectiveProjectId ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="task-milestone">Milestone</Label>
                  <Select
                    value={milestoneId ?? undefined}
                    onValueChange={(v) => {
                      form.setValue("milestone_id", v === "__none__" ? null : v);
                    }}
                  >
                    <SelectTrigger id="task-milestone" className="w-full">
                      <SelectValue placeholder="None">
                        {milestoneId
                          ? milestones.find((m) => m.id === milestoneId)?.title
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {milestones.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-due">Due date</Label>
                <Controller
                  name="due_date"
                  control={form.control}
                  render={({ field }) => (
                    <FormDatePicker
                      id="task-due"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Optional"
                    />
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-start">Start date</Label>
                <Controller
                  name="start_date"
                  control={form.control}
                  render={({ field }) => (
                    <FormDatePicker
                      id="task-start"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Optional"
                    />
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-estimate">Time estimate (minutes)</Label>
              <NumberInput
                id="task-estimate"
                allowDecimal={false}
                min="0"
                step="15"
                placeholder="e.g. 90"
                {...form.register("estimated_minutes")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                rows={3}
                maxLength={TASK_LIMITS.description}
                className="resize-y"
                placeholder="Context, acceptance criteria, or handoff notes."
                {...form.register("description")}
              />
            </div>
          </section>

          <Separator />

          {/* Labels & visibility */}
          <section className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Labels &amp; visibility
            </p>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-labels">Labels</Label>
              {labels.length > 0 ? (
                <div className="mb-1.5 flex flex-wrap gap-1.5">
                  {labels.map((l) => (
                    <button
                      key={l}
                      type="button"
                      className="task-label-badge inline-flex items-center gap-1"
                      onClick={() => removeLabel(l)}
                      aria-label={`Remove label ${l}`}
                    >
                      {l}
                      <span aria-hidden>×</span>
                    </button>
                  ))}
                </div>
              ) : null}
              <Input
                id="task-labels"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLabel();
                  }
                }}
                placeholder="Type and press Enter"
                maxLength={TASK_LIMITS.label}
                disabled={labels.length >= TASK_LIMITS.labelsMax}
              />
              <p className="text-xs text-muted-foreground">
                Up to {TASK_LIMITS.labelsMax} labels.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <Checkbox
                checked={clientVisible}
                onCheckedChange={(checked) => {
                  form.setValue("client_visible", checked === true);
                }}
                aria-label="Show task in client portal"
              />
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">Client visible</span>
                <span className="text-xs text-muted-foreground">
                  Include this task in client portal project progress.
                </span>
              </span>
            </label>
          </section>

          {/* Subtasks — edit mode only */}
          {task ? (
            <>
              <Separator />
              <section className="flex flex-col gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Subtasks
                  {subtasks.length > 0 ? (
                    <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/70">
                      — {doneSubtasks}/{subtasks.length} complete
                    </span>
                  ) : null}
                </p>

                {subtasks.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {subtasks.map((subtask) => (
                      <label key={subtask.id} className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={subtask.status === "done"}
                          disabled={isPending}
                          onCheckedChange={() => toggleSubtask(subtask)}
                          aria-label={`Toggle ${subtask.title}`}
                        />
                        <span
                          className={cn(
                            "leading-snug",
                            subtask.status === "done" &&
                              "text-muted-foreground line-through",
                          )}
                        >
                          {subtask.title}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <Input
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSubtask();
                      }
                    }}
                    placeholder="Add a checklist item"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addSubtask}
                    disabled={isPending || !subtaskTitle.trim()}
                  >
                    Add
                  </Button>
                </div>
              </section>
            </>
          ) : null}

          {/* Comments — edit mode only */}
          {task ? (
            <>
              <Separator />
              <section className="flex flex-col gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Comments
                </p>

                {comments.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {comments.map((comment) => (
                      <div key={comment.id} className="rounded-md bg-muted/50 p-3">
                        <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          You · {formatCommentTimestamp(comment.created_at)}
                          {comment.client_visible ? " · Client-visible" : " · Internal"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                <Textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  rows={3}
                  maxLength={TASK_LIMITS.commentBody}
                  placeholder="Add a project note or client update."
                  className="resize-y"
                  disabled={isPending}
                />
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      checked={commentClientVisible}
                      onCheckedChange={(checked) => {
                        setCommentClientVisible(checked === true);
                      }}
                    />
                    Client-visible
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={submitComment}
                    disabled={isPending || !commentBody.trim()}
                  >
                    Add comment
                  </Button>
                </div>
              </section>
            </>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-between">
            {task ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onDelete}
                disabled={isPending}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Delete task
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
            <div className="flex gap-2">
              {task ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              ) : null}
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isCreateMode
                    ? "Adding…"
                    : "Saving…"
                  : isCreateMode
                    ? "Add task"
                    : "Save changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
