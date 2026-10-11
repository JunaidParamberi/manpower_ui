"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { createProject, seedProjectFromPlanDraft, updateProject } from "@/lib/projects/actions";
import { applyTemplateToProject } from "@/lib/projects/template-actions";
import { projectCreateDefaultsForClient } from "@/lib/projects/form-values";
import { buildProjectFormInsights } from "@/lib/projects/project-form-insights";
import type { ProjectPlanDraft } from "@/lib/projects/proposal-to-project";
import {
  PROJECT_LIMITS,
  type ProjectCreateFormInput,
} from "@/lib/validations/project";
import { cn } from "@/lib/utils";
import { projectStatusLabel } from "@/lib/projects/display";
import type { ClientRow, ProjectStatus } from "@/types";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  WorkspaceFormAside,
  WorkspaceFormMain,
  WorkspaceFormSection,
  WorkspaceFormShell,
  WorkspaceInsightCard,
} from "@/components/shared/workspace-form-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDatePicker } from "@/components/shared/form-date-picker";
import { ProjectWorkspacePanel } from "@/components/features/projects/project-workspace-panel";

const STATUS_VALUES: ProjectStatus[] = [
  "planning",
  "active",
  "on_hold",
  "completed",
  "archived",
];

type ProjectFormProps =
  | {
      mode: "create";
      clients: ClientRow[];
      defaultValues?: ProjectCreateFormInput;
      planDraft?: ProjectPlanDraft | null;
      selectedTemplateId?: string | null;
    }
  | {
      mode: "edit";
      projectId: string;
      clients: ClientRow[];
      defaultValues: ProjectCreateFormInput;
    };

export function ProjectForm(props: ProjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const selectedTemplateId =
    props.mode === "create" ? (props.selectedTemplateId ?? null) : null;

  const defaults =
    props.mode === "create"
      ? (props.defaultValues ?? projectCreateDefaultsForClient({ clients: props.clients }))
      : props.defaultValues;
  const planDraft = props.mode === "create" ? (props.planDraft ?? null) : null;

  const {
    register,
    handleSubmit,
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ProjectCreateFormInput>({
    defaultValues: defaults,
  });

  function onSubmit(values: ProjectCreateFormInput) {
    setServerError(null);
    clearErrors();
    startTransition(async () => {
      if (props.mode === "create") {
        const created = await createProject(values);
        if (!created.ok) {
          setServerError(created.message);
          if (created.fieldErrors) {
            (
              Object.entries(created.fieldErrors) as [
                keyof ProjectCreateFormInput,
                string[] | undefined,
              ][]
            ).forEach(([key, msgs]) => {
              const msg = msgs?.[0];
              if (msg) {
                setError(key, { message: msg });
              }
            });
          }
          return;
        }

        // Seed from proposal planDraft (proposal → project flow)
        if (planDraft) {
          const seeded = await seedProjectFromPlanDraft(
            created.project.id,
            planDraft,
          );
          if (!seeded.ok) {
            toast.error(
              seeded.message ??
                "Project created, but milestones and tasks could not be added.",
            );
            router.push(`/projects/${created.project.id}`);
            router.refresh();
            return;
          }
        }

        // Seed from a saved template (independent of planDraft)
        if (selectedTemplateId) {
          const seeded = await applyTemplateToProject(
            created.project.id,
            selectedTemplateId,
          );
          if (!seeded.ok) {
            toast.error(
              seeded.message ??
                "Project created, but template milestones and tasks could not be added.",
            );
            router.push(`/projects/${created.project.id}`);
            router.refresh();
            return;
          }
        }

        toast.success(
          planDraft || selectedTemplateId
            ? "Project created with milestones and tasks"
            : "Project created",
        );
        router.push(`/projects/${created.project.id}`);
        router.refresh();
        return;
      }

      const updated = await updateProject(props.projectId, values);
      if (!updated.ok) {
        setServerError(updated.message);
        if (updated.fieldErrors) {
          (
            Object.entries(updated.fieldErrors) as [
              keyof ProjectCreateFormInput,
              string[] | undefined,
            ][]
          ).forEach(([key, msgs]) => {
            const msg = msgs?.[0];
            if (msg) {
              setError(key, { message: msg });
            }
          });
        }
        return;
      }

      toast.success("Project updated");
      router.push(`/projects/${props.projectId}`);
      router.refresh();
    });
  }

  const watchedValues = useWatch({ control });
  const insightValues = {
    ...defaults,
    ...watchedValues,
  } as ProjectCreateFormInput;
  const insights = buildProjectFormInsights({
    values: insightValues,
    clients: props.clients,
  });
  const cancelHref =
    props.mode === "create" ? "/projects" : `/projects/${props.projectId}`;

  if (props.clients.length === 0) {
    return (
      <WorkspaceFormShell>
        <WorkspaceFormMain>
          <WorkspaceFormSection
            title="Add a client first"
            description="Projects need a CRM client before budgets, timelines, and documents can connect cleanly."
          >
            <div className="flex flex-col items-start gap-4 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p>
                Create the client record first, then return here to launch the project
                with the right billing and portal context.
              </p>
              <Button nativeButton={false} render={<Link href="/clients/new" />}>
                New client
              </Button>
            </div>
          </WorkspaceFormSection>
        </WorkspaceFormMain>
        <WorkspaceFormAside>
          <WorkspaceInsightCard title="Why this matters">
            <p className="text-sm text-muted-foreground">
              Client links keep projects, tasks, quotes, invoices, receipts, and portal
              updates tied to the same relationship record.
            </p>
          </WorkspaceInsightCard>
        </WorkspaceFormAside>
      </WorkspaceFormShell>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <WorkspaceFormShell>
        <WorkspaceFormMain>
          {serverError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not save</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          {planDraft ? (
            <Alert>
              <AlertTitle>Imported from approved proposal</AlertTitle>
              <AlertDescription>
                {planDraft.milestones.length} milestone
                {planDraft.milestones.length === 1 ? "" : "s"} and{" "}
                {planDraft.tasks.length} task
                {planDraft.tasks.length === 1 ? "" : "s"} will be created when you
                save this project.
              </AlertDescription>
            </Alert>
          ) : null}

          <WorkspaceFormSection
            title="Project basics"
            description="Link the work to a client and give it a clear operational status."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="project_client">
                  Client <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="client_id"
                  control={control}
                  rules={{ required: "Client is required." }}
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={(v) => {
                        field.onChange(v ?? "");
                      }}
                    >
                      <SelectTrigger
                        id="project_client"
                        className="w-full min-w-0"
                        size="default"
                        aria-invalid={Boolean(errors.client_id)}
                      >
                        <SelectValue placeholder="Select client">
                          {field.value
                            ? (props.clients.find((c) => c.id === field.value)?.name ??
                              "Unknown client")
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {props.clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.client_id ? (
                  <p className="text-xs text-destructive">
                    {errors.client_id.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="project_status">Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        if (v) {
                          field.onChange(v as ProjectStatus);
                        }
                      }}
                    >
                      <SelectTrigger
                        id="project_status"
                        className="w-full min-w-0"
                        size="default"
                      >
                        <SelectValue placeholder="Select status">
                          {field.value ? projectStatusLabel(field.value) : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {STATUS_VALUES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {projectStatusLabel(s)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex flex-col gap-2 lg:col-span-2">
                <Label htmlFor="project_title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="project_title"
                  maxLength={PROJECT_LIMITS.title}
                  aria-invalid={Boolean(errors.title)}
                  placeholder="Website relaunch, brand sprint, monthly retainer..."
                  {...register("title", { required: "Title is required." })}
                />
                {errors.title ? (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                ) : null}
              </div>
            </div>
          </WorkspaceFormSection>

          <WorkspaceFormSection
            title="Money"
            description="Use budget and spent to keep project margin visible before work starts drifting."
          >
            <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project_budget">Budget</Label>
              <Input
                id="project_budget"
                type="text"
                inputMode="decimal"
                placeholder="0"
                aria-invalid={Boolean(errors.budget)}
                {...register("budget")}
              />
              {errors.budget ? (
                <p className="text-xs text-destructive">
                  {errors.budget.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="project_spent">Spent</Label>
              <Input
                id="project_spent"
                type="text"
                inputMode="decimal"
                placeholder="0"
                aria-invalid={Boolean(errors.spent)}
                {...register("spent")}
              />
              {errors.spent ? (
                <p className="text-xs text-destructive">
                  {errors.spent.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="project_hourly_rate">Hourly rate</Label>
              <Input
                id="project_hourly_rate"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 150"
                aria-invalid={Boolean(errors.hourly_rate)}
                {...register("hourly_rate")}
              />
              {errors.hourly_rate ? (
                <p className="text-xs text-destructive">
                  {errors.hourly_rate.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Default rate for billing tracked time on this project.
                </p>
              )}
            </div>
          </div>
          </WorkspaceFormSection>

          <WorkspaceFormSection
            title="Schedule"
            description="Set the working window so task planning and client expectations stay aligned."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
              <Label htmlFor="project_start">Start date</Label>
              <Controller
                name="start_date"
                control={control}
                render={({ field }) => (
                  <FormDatePicker
                    id="project_start"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Start date"
                    aria-invalid={Boolean(errors.start_date)}
                  />
                )}
              />
              {errors.start_date ? (
                <p className="text-xs text-destructive">
                  {errors.start_date.message}
                </p>
              ) : null}
            </div>
              <div className="flex flex-col gap-2">
              <Label htmlFor="project_deadline">Deadline</Label>
              <Controller
                name="deadline"
                control={control}
                render={({ field }) => (
                  <FormDatePicker
                    id="project_deadline"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Deadline"
                    aria-invalid={Boolean(errors.deadline)}
                  />
                )}
              />
              {errors.deadline ? (
                <p className="text-xs text-destructive">
                  {errors.deadline.message}
                </p>
              ) : null}
            </div>
            </div>
          </WorkspaceFormSection>

          <WorkspaceFormSection
            title={props.mode === "create" ? "Create project" : "Save project changes"}
            description="Save the setup, then move into tasks, documents, and delivery tracking."
            contentClassName="pt-0"
            footer={
              <div className="flex w-full flex-wrap justify-end gap-2">
                <Link
                  href={cancelHref}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Cancel
                </Link>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? "Saving..."
                    : props.mode === "create"
                      ? "Create project"
                      : "Save changes"}
                </Button>
              </div>
            }
          >
            <p className="text-sm text-muted-foreground">
              Project setup controls the client link, budget guardrails, and the
              timeline shown across task and document workflows.
            </p>
          </WorkspaceFormSection>
        </WorkspaceFormMain>

        <WorkspaceFormAside>
          <ProjectWorkspacePanel insights={insights} mode={props.mode} />
        </WorkspaceFormAside>
      </WorkspaceFormShell>
    </form>
  );
}
