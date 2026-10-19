"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { createWorker, updateWorker } from "@/lib/workers/worker-mutations";
import { buildWorkerFormInsights } from "@/lib/workers/worker-form-insights";
import {
  WORKER_LIMITS,
  WORKER_STATUSES,
  WORKER_STATUS_LABELS,
  type WorkerInput,
} from "@/lib/validations/worker";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormDatePicker } from "@/components/shared/form-date-picker";
import {
  WorkspaceFormAside,
  WorkspaceFormMain,
  WorkspaceFormShell,
} from "@/components/shared/workspace-form-shell";
import { WorkerWorkspacePanel } from "@/components/features/workers/worker-workspace-panel";
import type { ProjectClientRow, SupplierRow, WorkerListRow } from "@/types";

/**
 * Sentinel for the "No supplier" option — a nullable Select can't use an empty
 * string value here. Mirrors EXPENSE_NONE_PROJECT_VALUE / CLIENT_CURRENCY_INHERIT.
 */
const SUPPLIER_NONE = "__none";

type WorkerFormProps =
  | {
      mode: "create";
      suppliers: SupplierRow[];
      projectClients: ProjectClientRow[];
    }
  | {
      mode: "edit";
      worker: WorkerListRow;
      suppliers: SupplierRow[];
      projectClients: ProjectClientRow[];
    };

const emptyDefaults: WorkerInput = {
  employee_id: "",
  name: "",
  nationality: "",
  trade_category: "",
  status: "available",
  supplier_id: null,
  client_ids: [],
  notes: "",
  passport_number: "",
  passport_expiry: "",
  emirates_id: "",
  emirates_id_expiry: "",
  visa_number: "",
  visa_expiry: "",
  medical_fit: false,
  medical_expiry: "",
  has_insurance: false,
  insurance_expiry: "",
};

function workerToFormValues(worker: WorkerListRow): WorkerInput {
  return {
    id: worker.id,
    employee_id: worker.employee_id,
    name: worker.name,
    nationality: worker.nationality ?? "",
    trade_category: worker.trade_category ?? "",
    status: worker.status,
    supplier_id: worker.supplier_id,
    client_ids: worker.clients.map((c) => c.id),
    notes: worker.notes ?? "",
    passport_number: worker.passport_number ?? "",
    passport_expiry: worker.passport_expiry ?? "",
    emirates_id: worker.emirates_id ?? "",
    emirates_id_expiry: worker.emirates_id_expiry ?? "",
    visa_number: worker.visa_number ?? "",
    visa_expiry: worker.visa_expiry ?? "",
    medical_fit: worker.medical_fit,
    medical_expiry: worker.medical_expiry ?? "",
    has_insurance: worker.has_insurance,
    insurance_expiry: worker.insurance_expiry ?? "",
  };
}

export function WorkerForm(props: WorkerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(
    props.mode === "edit" ? props.worker.clients.map((c) => c.id) : [],
  );

  const defaults =
    props.mode === "edit" ? workerToFormValues(props.worker) : emptyDefaults;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<WorkerInput>({
    defaultValues: defaults,
  });

  const nowIso = useMemo(() => new Date().toISOString(), []);
  const watchedValues = useWatch({ control });
  const insightValues = { ...defaults, ...watchedValues } as WorkerInput;
  const insights = buildWorkerFormInsights(
    insightValues,
    nowIso,
    props.suppliers,
  );

  function toggleClient(id: string) {
    const next = selectedClientIds.includes(id)
      ? selectedClientIds.filter((c) => c !== id)
      : [...selectedClientIds, id];
    setSelectedClientIds(next);
    setValue("client_ids", next);
  }

  function onSubmit(values: WorkerInput) {
    startTransition(async () => {
      const payload = { ...values, client_ids: selectedClientIds };
      const result =
        props.mode === "create"
          ? await createWorker(payload)
          : await updateWorker({ ...payload, id: props.worker.id });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        props.mode === "create" ? "Worker added" : "Worker updated",
      );
      router.push(`/workers/${result.worker.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <WorkspaceFormShell>
        <WorkspaceFormMain>
          <FieldGroup className="grid gap-x-6 gap-y-7 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="worker-employee-id">
                Employee ID *
              </FieldLabel>
              <Input
                id="worker-employee-id"
                maxLength={WORKER_LIMITS.employee_id}
                disabled={props.mode === "edit"}
                {...register("employee_id", { required: true })}
              />
              {errors.employee_id && (
                <p className="text-sm text-destructive">
                  Employee ID is required.
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="worker-name">Name *</FieldLabel>
              <Input
                id="worker-name"
                maxLength={WORKER_LIMITS.name}
                {...register("name", { required: true })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">Name is required.</p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="worker-nationality">Nationality</FieldLabel>
              <Input
                id="worker-nationality"
                maxLength={WORKER_LIMITS.nationality}
                {...register("nationality")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="worker-trade">Trade category</FieldLabel>
              <Input
                id="worker-trade"
                maxLength={WORKER_LIMITS.trade_category}
                {...register("trade_category")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="worker-supplier">Supplier</FieldLabel>
              <Select
                value={watch("supplier_id") ?? SUPPLIER_NONE}
                onValueChange={(v) =>
                  setValue("supplier_id", v === SUPPLIER_NONE ? null : v)
                }
              >
                <SelectTrigger id="worker-supplier">
                  <span className="truncate text-start">
                    {props.suppliers.find((s) => s.id === watch("supplier_id"))
                      ?.name ?? "Leave blank for internal workers"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={SUPPLIER_NONE}>No supplier</SelectItem>
                    {props.suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="worker-status">Status *</FieldLabel>
              <Select
                value={watch("status")}
                onValueChange={(v) =>
                  setValue("status", v as WorkerInput["status"])
                }
              >
                <SelectTrigger id="worker-status">
                  <span className="truncate text-start">
                    {WORKER_STATUS_LABELS[watch("status")]}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {WORKER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {WORKER_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel>Clients</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {props.projectClients.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleClient(c.id)}
                    className={
                      selectedClientIds.includes(c.id)
                        ? "rounded-full border border-primary bg-primary/10 px-3 py-1 text-sm text-primary"
                        : "rounded-full border border-border/80 px-3 py-1 text-sm text-muted-foreground"
                    }
                  >
                    {c.name}
                  </button>
                ))}
                {props.projectClients.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No project clients yet.
                  </p>
                )}
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="worker-passport-number">
                Passport Number
              </FieldLabel>
              <Input
                id="worker-passport-number"
                maxLength={WORKER_LIMITS.doc_number}
                {...register("passport_number")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="worker-passport-expiry">
                Passport Expiry
              </FieldLabel>
              <Controller
                name="passport_expiry"
                control={control}
                render={({ field }) => (
                  <FormDatePicker
                    id="worker-passport-expiry"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="worker-emirates-id">Emirates ID</FieldLabel>
              <Input
                id="worker-emirates-id"
                maxLength={WORKER_LIMITS.doc_number}
                {...register("emirates_id")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="worker-emirates-id-expiry">
                Emirates ID Expiry
              </FieldLabel>
              <Controller
                name="emirates_id_expiry"
                control={control}
                render={({ field }) => (
                  <FormDatePicker
                    id="worker-emirates-id-expiry"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="worker-visa-number">Visa Number</FieldLabel>
              <Input
                id="worker-visa-number"
                maxLength={WORKER_LIMITS.doc_number}
                {...register("visa_number")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="worker-visa-expiry">Visa Expiry</FieldLabel>
              <Controller
                name="visa_expiry"
                control={control}
                render={({ field }) => (
                  <FormDatePicker
                    id="worker-visa-expiry"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>

            <Field>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={watch("medical_fit")}
                  onCheckedChange={(checked) =>
                    setValue("medical_fit", checked === true)
                  }
                />
                <span className="font-medium">Medically fit</span>
              </label>
            </Field>
            <Field>
              <FieldLabel htmlFor="worker-medical-expiry">
                Medical Expiry
              </FieldLabel>
              <Controller
                name="medical_expiry"
                control={control}
                render={({ field }) => (
                  <FormDatePicker
                    id="worker-medical-expiry"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>

            <Field>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={watch("has_insurance")}
                  onCheckedChange={(checked) =>
                    setValue("has_insurance", checked === true)
                  }
                />
                <span className="font-medium">Has insurance</span>
              </label>
            </Field>
            <Field>
              <FieldLabel htmlFor="worker-insurance-expiry">
                Insurance Expiry
              </FieldLabel>
              <Controller
                name="insurance_expiry"
                control={control}
                render={({ field }) => (
                  <FormDatePicker
                    id="worker-insurance-expiry"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="worker-notes">Notes</FieldLabel>
              <Textarea
                id="worker-notes"
                maxLength={WORKER_LIMITS.notes}
                {...register("notes")}
              />
            </Field>
          </FieldGroup>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {props.mode === "create" ? "Add worker" : "Save changes"}
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/workers" />}
            >
              Cancel
            </Button>
          </div>
        </WorkspaceFormMain>

        <WorkspaceFormAside>
          <WorkerWorkspacePanel insights={insights} mode={props.mode} />
        </WorkspaceFormAside>
      </WorkspaceFormShell>
    </form>
  );
}
