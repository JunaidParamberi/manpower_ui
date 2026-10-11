"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { isSameDay, parseISO } from "date-fns";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  convertTimeEntriesToInvoice,
  createManualTimeEntry,
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
  updateRunningTimerDescription,
} from "@/lib/time/actions";
import { listTasksForProject } from "@/lib/tasks/actions";
import {
  summarizeSelection,
  type BillableEntry,
} from "@/lib/time/billing-utils";
import {
  combineLocalDateAndTime,
  formatProjectOptionLabel,
  resolveProjectTriggerLabel,
  TASK_SELECT_NONE,
  taskIdFromForm,
} from "@/lib/utils/time-form";
import { billableElapsedSecondsForOpenEntry } from "@/lib/utils/time-entry-elapsed";
import { cn } from "@/lib/utils";
import type { ProjectListRow, TaskRow, TimeEntryListRow } from "@/types";

import { TimeBillingBar } from "@/components/features/time/time-billing-bar";
import { FormDatePicker } from "@/components/shared/form-date-picker";
import { FormTimePopover } from "@/components/shared/form-time-popover";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays, Timer } from "lucide-react";
import { toast } from "sonner";
import { SkeletonCountRecorder } from "@/hooks/use-skeleton-count";

export type TimeTrackerProps = {
  projects: ProjectListRow[];
  entries: TimeEntryListRow[];
};

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) {
    return `${h}h ${m}m ${r}s`;
  }
  if (m > 0) {
    return `${m}m ${r}s`;
  }
  return `${r}s`;
}

function formatClockDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

type ManualFormValues = {
  project_id: string;
  task_id: string;
  description: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
};

type StartFormValues = {
  project_id: string;
  task_id: string;
  description: string;
};

function EntryRows({
  rows,
  selected,
  onToggle,
}: {
  rows: TimeEntryListRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <>
      {rows.map((row) => {
        const isBillable = !row.billed && Boolean(row.project?.client_id);
        const isBilled = row.billed;
        return (
          <TableRow
            key={row.id}
            className={selected.has(row.id) ? "bg-muted/40" : undefined}
          >
            <TableCell className="w-8 pr-0">
              {isBillable ? (
                <Checkbox
                  checked={selected.has(row.id)}
                  onCheckedChange={() => onToggle(row.id)}
                  aria-label={`Select entry for ${row.project?.title ?? "project"}`}
                />
              ) : isBilled ? (
                <Badge variant="secondary" className="text-xs">
                  Billed
                </Badge>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </TableCell>
            <TableCell className="font-medium">
              {row.project?.title ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {row.task?.title ?? "—"}
            </TableCell>
            <TableCell className="hidden max-w-[10rem] truncate text-muted-foreground text-sm lg:table-cell">
              {row.description?.trim() ? row.description : "—"}
            </TableCell>
            <TableCell className="font-mono tabular-nums">
              {row.duration_seconds !== null
                ? formatDuration(row.duration_seconds)
                : "—"}
            </TableCell>
            <TableCell className="hidden text-muted-foreground text-sm sm:table-cell">
              {new Date(row.started_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </TableCell>
            <TableCell className="hidden text-muted-foreground text-sm md:table-cell">
              {row.ended_at
                ? new Date(row.ended_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "—"}
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

function toBillableEntry(entry: TimeEntryListRow): BillableEntry {
  return {
    id: entry.id,
    description: entry.description,
    durationSeconds: entry.duration_seconds,
    billed: entry.billed,
    project: entry.project
      ? {
          id: entry.project.id,
          title: entry.project.title,
          clientId: entry.project.client_id,
          hourlyRate: entry.project.hourly_rate,
        }
      : null,
  };
}

export function TimeTracker({ projects, entries }: TimeTrackerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [billingPending, startBillingTransition] = useTransition();
  const [timerTick, setTimerTick] = useState(0);
  const [tasksForManual, setTasksForManual] = useState<TaskRow[]>([]);
  const [tasksForStart, setTasksForStart] = useState<TaskRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [runningNoteDraft, setRunningNoteDraft] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleEntry(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleCreate() {
    startBillingTransition(async () => {
      const result = await convertTimeEntriesToInvoice({
        entryIds: [...selected],
      });
      if (result.ok && result.documentId) {
        setSelected(new Set());
        router.push(`/documents/${result.documentId}`);
      } else {
        const msg = result.error ?? "Failed to create invoice.";
        setError(msg);
        toast.error(msg);
      }
    });
  }

  const selectedBillableEntries: BillableEntry[] = useMemo(
    () =>
      [...entries]
        .filter((e) => selected.has(e.id))
        .map(toBillableEntry),
    [entries, selected],
  );

  const billingBarSummary = useMemo(
    () => summarizeSelection(selectedBillableEntries),
    [selectedBillableEntries],
  );

  const running = useMemo(
    () => entries.find((e) => e.ended_at === null) ?? null,
    [entries],
  );

  const completedEntries = useMemo(
    () => entries.filter((e) => e.ended_at !== null),
    [entries],
  );

  const { todayEntries, earlierEntries, totalSecondsToday } = useMemo(() => {
    const now = new Date();
    const today: TimeEntryListRow[] = [];
    const earlier: TimeEntryListRow[] = [];
    let total = 0;
    for (const e of completedEntries) {
      if (!e.ended_at) {
        continue;
      }
      const end = parseISO(e.ended_at);
      if (isSameDay(end, now)) {
        today.push(e);
        total += e.duration_seconds ?? 0;
      } else {
        earlier.push(e);
      }
    }
    today.sort(
      (a, b) =>
        new Date(b.ended_at!).getTime() - new Date(a.ended_at!).getTime(),
    );
    earlier.sort(
      (a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    );
    return {
      todayEntries: today,
      earlierEntries: earlier,
      totalSecondsToday: total,
    };
  }, [completedEntries]);

  useEffect(() => {
    if (running) {
      setRunningNoteDraft(running.description ?? "");
    } else {
      setRunningNoteDraft("");
    }
  }, [running]);

  useEffect(() => {
    if (!running || running.paused_at) {
      return;
    }
    const id = setInterval(() => {
      setTimerTick((n) => n + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  void timerTick;
  const runningDurationSeconds =
    running !== null
      ? billableElapsedSecondsForOpenEntry(running, new Date())
      : 0;

  const defaultProjectId = projects[0]?.id ?? "";

  const manualForm = useForm<ManualFormValues>({
    defaultValues: {
      project_id: defaultProjectId,
      task_id: TASK_SELECT_NONE,
      description: "",
      start_date: "",
      start_time: "",
      end_date: "",
      end_time: "",
    },
  });

  const manualStartDate = manualForm.watch("start_date");
  const manualEndDate = manualForm.watch("end_date");
  const setManualValue = manualForm.setValue;

  useEffect(() => {
    if (!manualStartDate.trim()) {
      setManualValue("start_time", "");
    }
  }, [manualStartDate, setManualValue]);

  useEffect(() => {
    if (!manualEndDate.trim()) {
      setManualValue("end_time", "");
    }
  }, [manualEndDate, setManualValue]);

  const startForm = useForm<StartFormValues>({
    defaultValues: {
      project_id: defaultProjectId,
      task_id: TASK_SELECT_NONE,
      description: "",
    },
  });

  const setStartFormValue = startForm.setValue;

  useEffect(() => {
    if (running?.project_id) {
      setStartFormValue("project_id", running.project_id);
    }
  }, [running?.project_id, setStartFormValue]);

  function loadTasksForManual(projectId: string) {
    setTasksForManual([]);
    manualForm.setValue("task_id", TASK_SELECT_NONE);
    if (!projectId) {
      return;
    }
    startTransition(async () => {
      const res = await listTasksForProject(projectId);
      if (res.ok) {
        setTasksForManual(res.tasks);
      }
    });
  }

  function loadTasksForStart(projectId: string) {
    setTasksForStart([]);
    startForm.setValue("task_id", TASK_SELECT_NONE);
    if (!projectId) {
      return;
    }
    startTransition(async () => {
      const res = await listTasksForProject(projectId);
      if (res.ok) {
        setTasksForStart(res.tasks);
      }
    });
  }

  const hasProjects = projects.length > 0;

  function onManualSubmit(values: ManualFormValues) {
    setError(null);
    const startedIso = combineLocalDateAndTime(
      values.start_date,
      values.start_time,
    );
    const endedIso = combineLocalDateAndTime(values.end_date, values.end_time);
    if (!startedIso || !endedIso) {
      setError("Pick a valid start and end date and time.");
      return;
    }
    startTransition(async () => {
      const result = await createManualTimeEntry({
        project_id: values.project_id,
        task_id: taskIdFromForm(values.task_id),
        description: values.description,
        started_at: startedIso,
        ended_at: endedIso,
      });
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message ?? "Failed to log time entry.");
        return;
      }
      toast.success("Time entry logged");
      manualForm.reset({
        project_id: values.project_id,
        task_id: TASK_SELECT_NONE,
        description: "",
        start_date: "",
        start_time: "",
        end_date: "",
        end_time: "",
      });
      setTasksForManual([]);
      router.refresh();
    });
  }

  function onStartSubmit(values: StartFormValues) {
    setError(null);
    startTransition(async () => {
      const result = await startTimer({
        project_id: values.project_id,
        task_id: taskIdFromForm(values.task_id),
        description: values.description,
        started_at: new Date().toISOString(),
      });
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message ?? "Failed to start timer.");
        return;
      }
      router.refresh();
    });
  }

  function onStop() {
    setError(null);
    startTransition(async () => {
      const result = await stopTimer();
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message ?? "Failed to stop timer.");
        return;
      }
      router.refresh();
    });
  }

  function onPause() {
    setError(null);
    startTransition(async () => {
      const result = await pauseTimer();
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message ?? "Failed to pause timer.");
        return;
      }
      router.refresh();
    });
  }

  function onResume() {
    setError(null);
    startTransition(async () => {
      const result = await resumeTimer();
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message ?? "Failed to resume timer.");
        return;
      }
      router.refresh();
    });
  }

  function onRunningNoteBlur() {
    if (!running) {
      return;
    }
    const trimmed = runningNoteDraft.trim();
    const serverVal = running.description?.trim() ?? "";
    if (trimmed === serverVal) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateRunningTimerDescription({
        description: runningNoteDraft,
      });
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message ?? "Failed to save description.");
        return;
      }
      router.refresh();
    });
  }

  const runningProjectTitle = running
    ? resolveProjectTriggerLabel(running.project_id, projects, "Project")
    : "";

  return (
    <div className="flex flex-col gap-8">
      <SkeletonCountRecorder id="time:today" count={todayEntries.length} />
      <SkeletonCountRecorder id="time:earlier" count={earlierEntries.length} />
      <PageHeader
        eyebrow="Work"
        title="Time tracker"
        description="Track billable hours by project. Start a live timer or log time manually."
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!hasProjects ? (
        <Alert>
          <AlertTitle>No projects yet</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>Create a project linked to a client before logging time.</span>
            <Button nativeButton={false} render={<Link href="/projects/new" />}>
              New project
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card
        className={cn(
          running &&
            "border-primary/25 bg-primary/5 shadow-sm ring-1 ring-primary/15",
        )}
      >
        <CardHeader className="flex flex-col gap-2 space-y-0">
          <div className="flex flex-wrap items-center gap-2">
            <Timer
              className={cn(
                "size-5 shrink-0",
                running ? "text-primary" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <CardTitle className="text-lg">
              {running ? "Timer running" : "Live timer"}
            </CardTitle>
            {running && !running.paused_at ? (
              <Badge variant="secondary" className="w-fit">
                Live
              </Badge>
            ) : null}
            {running && running.paused_at ? (
              <Badge variant="outline" className="w-fit">
                Paused
              </Badge>
            ) : null}
          </div>
          <CardDescription>
            {running && running.paused_at
              ? "Resume when you continue, or stop to save this block."
              : running
                ? "Stop when you finish this block."
                : "Pick a project and optional task, then start the clock."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p
              className={cn(
                "font-mono font-semibold tabular-nums tracking-tight",
                "text-5xl sm:text-6xl md:text-7xl",
                running ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {running
                ? formatClockDuration(runningDurationSeconds)
                : "00:00:00"}
            </p>
            {running ? (
              <>
                <p className="font-medium text-foreground text-sm">
                  {runningProjectTitle}
                  {running.task ? ` · ${running.task.title}` : null}
                </p>
                <p className="text-muted-foreground text-xs">
                  Started{" "}
                  {new Date(running.started_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <Field className="gap-2 pt-1">
                  <FieldLabel htmlFor="running-description">
                    What are you working on?
                  </FieldLabel>
                  <Textarea
                    id="running-description"
                    placeholder="Short note for your records…"
                    disabled={isPending}
                    rows={3}
                    value={runningNoteDraft}
                    onChange={(e) => setRunningNoteDraft(e.target.value)}
                    onBlur={onRunningNoteBlur}
                    className="min-h-[4.5rem] resize-y bg-background"
                  />
                </Field>
              </>
            ) : null}
          </div>

          {!running ? (
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="start-project">Project</FieldLabel>
                <Controller
                  control={startForm.control}
                  name="project_id"
                  render={({ field }) => (
                    <Select
                      disabled={!hasProjects || Boolean(running) || isPending}
                      onValueChange={(v) => {
                        const id = v ?? "";
                        field.onChange(id);
                        loadTasksForStart(id);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger id="start-project" className="w-full min-w-0">
                        <span className="truncate text-start">
                          {resolveProjectTriggerLabel(field.value, projects)}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {formatProjectOptionLabel(p)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="start-task">Task (optional)</FieldLabel>
                <Controller
                  control={startForm.control}
                  name="task_id"
                  render={({ field }) => (
                    <Select
                      disabled={
                        !hasProjects || Boolean(running) || isPending
                      }
                      onValueChange={field.onChange}
                      value={field.value || TASK_SELECT_NONE}
                    >
                      <SelectTrigger id="start-task" className="w-full min-w-0">
                        <span className="truncate text-start">
                          {field.value === TASK_SELECT_NONE || !field.value
                            ? "No task"
                            : tasksForStart.find((t) => t.id === field.value)
                                ?.title ?? "Task"}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TASK_SELECT_NONE}>No task</SelectItem>
                        {tasksForStart.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="start-description">
                  What are you working on? (optional)
                </FieldLabel>
                <Controller
                  control={startForm.control}
                  name="description"
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="start-description"
                      placeholder="Short note for your records…"
                      disabled={!hasProjects || Boolean(running) || isPending}
                      rows={3}
                      className="min-h-[4.5rem] resize-y bg-background"
                    />
                  )}
                />
              </Field>
            </FieldGroup>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant={running ? "outline" : "default"}
              size="lg"
              className="min-w-[7rem]"
              disabled={!hasProjects || Boolean(running) || isPending}
              onClick={() => startForm.handleSubmit(onStartSubmit)()}
            >
              Start
            </Button>
            {running && !running.paused_at ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="min-w-[7rem]"
                disabled={isPending}
                onClick={onPause}
              >
                Pause
              </Button>
            ) : null}
            {running && running.paused_at ? (
              <Button
                type="button"
                variant="default"
                size="lg"
                className="min-w-[7rem]"
                disabled={isPending}
                onClick={onResume}
              >
                Resume
              </Button>
            ) : null}
            <Button
              type="button"
              variant={running ? "destructive" : "outline"}
              size="lg"
              className="min-w-[7rem]"
              disabled={!running || isPending}
              onClick={onStop}
            >
              Stop
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Log time manually</CardTitle>
            <CardDescription>
              Choose start and end date and time in your timezone. Duration is
              calculated when you save.
            </CardDescription>
          </CardHeader>
          <form
            onSubmit={manualForm.handleSubmit(onManualSubmit)}
            className="flex flex-1 flex-col"
          >
            <CardContent className="flex flex-col gap-4">
              <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="manual-project">Project</FieldLabel>
                <Controller
                  control={manualForm.control}
                  name="project_id"
                  render={({ field }) => (
                    <Select
                      disabled={!hasProjects || isPending}
                      onValueChange={(v) => {
                        const id = v ?? "";
                        field.onChange(id);
                        loadTasksForManual(id);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger id="manual-project" className="w-full min-w-0">
                        <span className="truncate text-start">
                          {resolveProjectTriggerLabel(field.value, projects)}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {formatProjectOptionLabel(p)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="manual-task">Task (optional)</FieldLabel>
                <Controller
                  control={manualForm.control}
                  name="task_id"
                  render={({ field }) => (
                    <Select
                      disabled={!hasProjects || isPending}
                      onValueChange={field.onChange}
                      value={field.value || TASK_SELECT_NONE}
                    >
                      <SelectTrigger id="manual-task" className="w-full min-w-0">
                        <span className="truncate text-start">
                          {field.value === TASK_SELECT_NONE || !field.value
                            ? "No task"
                            : tasksForManual.find((t) => t.id === field.value)
                                ?.title ?? "Task"}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TASK_SELECT_NONE}>
                          No task
                        </SelectItem>
                        {tasksForManual.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="manual-description">
                  Note (optional)
                </FieldLabel>
                <Controller
                  control={manualForm.control}
                  name="description"
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="manual-description"
                      placeholder="What did you work on in this block?"
                      disabled={!hasProjects || isPending}
                      rows={3}
                      className="min-h-[4.5rem] resize-y bg-background"
                    />
                  )}
                />
              </Field>

              <div className="flex flex-col gap-6">
                <Field>
                  <FieldTitle>Started</FieldTitle>
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        <Controller
                          control={manualForm.control}
                          name="start_date"
                          render={({ field }) => (
                            <FormDatePicker
                              id="manual-start-date"
                              value={field.value}
                              onChange={field.onChange}
                              disabled={!hasProjects || isPending}
                              placeholder="Start date"
                            />
                          )}
                        />
                      </div>
                      <div className="min-w-0 shrink-0 sm:min-w-[11rem]">
                        <Controller
                          control={manualForm.control}
                          name="start_time"
                          render={({ field }) => (
                            <FormTimePopover
                              id="manual-start-time"
                              className="justify-start"
                              value={field.value}
                              onChange={field.onChange}
                              disabled={
                                !hasProjects ||
                                isPending ||
                                !manualStartDate.trim()
                              }
                              placeholder="Start time"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </Field>

                <Field>
                  <FieldTitle>Ended</FieldTitle>
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        <Controller
                          control={manualForm.control}
                          name="end_date"
                          render={({ field }) => (
                            <FormDatePicker
                              id="manual-end-date"
                              value={field.value}
                              onChange={field.onChange}
                              disabled={!hasProjects || isPending}
                              placeholder="End date"
                            />
                          )}
                        />
                      </div>
                      <div className="min-w-0 shrink-0 sm:min-w-[11rem]">
                        <Controller
                          control={manualForm.control}
                          name="end_time"
                          render={({ field }) => (
                            <FormTimePopover
                              id="manual-end-time"
                              className="justify-start"
                              value={field.value}
                              onChange={field.onChange}
                              disabled={
                                !hasProjects ||
                                isPending ||
                                !manualEndDate.trim()
                              }
                              placeholder="End time"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </Field>
              </div>
              </FieldGroup>
            </CardContent>
            <CardFooter className="mt-8 flex-col items-stretch border-t border-border sm:flex-row sm:justify-end">
              <Button type="submit" disabled={!hasProjects || isPending}>
                Log time
              </Button>
            </CardFooter>
          </form>
        </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-2 space-y-0">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
          <CardTitle className="text-base">Today</CardTitle>
          <CardDescription className="w-full sm:w-auto sm:flex-1">
            Entries completed today in your local timezone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No entries completed today yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Project</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead className="hidden lg:table-cell">Note</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="hidden sm:table-cell">Start</TableHead>
                  <TableHead className="hidden md:table-cell">End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <EntryRows
                  rows={todayEntries}
                  selected={selected}
                  onToggle={toggleEntry}
                />
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="font-medium text-foreground"
                  >
                    Total today
                  </TableCell>
                  <TableCell className="font-mono font-semibold tabular-nums">
                    {formatDuration(totalSecondsToday)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell" />
                  <TableCell className="hidden sm:table-cell" />
                  <TableCell className="hidden md:table-cell" />
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Earlier</CardTitle>
          <CardDescription>
            Completed entries before today, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earlierEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No older entries yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Project</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead className="hidden lg:table-cell">Note</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="hidden sm:table-cell">Start</TableHead>
                  <TableHead className="hidden md:table-cell">End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <EntryRows
                  rows={earlierEntries}
                  selected={selected}
                  onToggle={toggleEntry}
                />
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Separator className="opacity-50" />

      <p className="text-muted-foreground text-center text-xs">
        Tip: project names come from your CRM. Fix typos under Projects or
        Clients.
      </p>

      <TimeBillingBar
        summary={billingBarSummary}
        currency="USD"
        pending={billingPending}
        onCreate={handleCreate}
      />
    </div>
  );
}
