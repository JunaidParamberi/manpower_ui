import {
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
  Controller,
} from "react-hook-form";

import { expiryNote } from "@/lib/workers/worker-form-insights";
import { WORKER_LIMITS, type WorkerInput } from "@/lib/validations/worker";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDatePicker } from "@/components/shared/form-date-picker";
import { cn } from "@/lib/utils";

const DOCUMENT_ROWS = [
  {
    label: "Passport",
    numberField: "passport_number",
    numberId: "worker-passport-number",
    expiryField: "passport_expiry",
    expiryId: "worker-passport-expiry",
  },
  {
    label: "Emirates ID",
    numberField: "emirates_id",
    numberId: "worker-emirates-id",
    expiryField: "emirates_id_expiry",
    expiryId: "worker-emirates-id-expiry",
  },
  {
    label: "Visa",
    numberField: "visa_number",
    numberId: "worker-visa-number",
    expiryField: "visa_expiry",
    expiryId: "worker-visa-expiry",
  },
] as const;

const CHECKBOX_ROWS = [
  {
    label: "Medical",
    checkLabel: "Medically fit",
    checkField: "medical_fit",
    expiryField: "medical_expiry",
    expiryId: "worker-medical-expiry",
  },
  {
    label: "Insurance",
    checkLabel: "Insured",
    checkField: "has_insurance",
    expiryField: "insurance_expiry",
    expiryId: "worker-insurance-expiry",
  },
] as const;

const NOTE_TONE = {
  danger: "text-destructive",
  warning: "text-[var(--warning)]",
  muted: "text-muted-foreground",
} as const;

const GRID =
  "grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)_11rem] sm:items-center sm:gap-3";

type WorkerDocumentsTableProps = {
  control: Control<WorkerInput>;
  register: UseFormRegister<WorkerInput>;
  watch: UseFormWatch<WorkerInput>;
  setValue: UseFormSetValue<WorkerInput>;
  nowIso: string;
};

/**
 * Documents & medical as one scan-friendly table (Document · Number · Expiry)
 * instead of a stack of separately-labelled fields.
 */
export function WorkerDocumentsTable({
  control,
  register,
  watch,
  setValue,
  nowIso,
}: WorkerDocumentsTableProps) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[540px] rounded-lg border border-border">
        <div
          className={cn(
            GRID,
            "hidden bg-muted px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid",
          )}
        >
          <span>Document</span>
          <span>Number / status</span>
          <span>Expiry</span>
        </div>

        {DOCUMENT_ROWS.map((row) => {
          const note = expiryNote(watch(row.expiryField) ?? "", nowIso);
          return (
            <div
              key={row.label}
              className={cn(GRID, "border-t border-border px-3 py-2.5")}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {row.label}
                {note ? (
                  <span
                    className={cn("text-xs font-normal", NOTE_TONE[note.tone])}
                  >
                    {note.label}
                  </span>
                ) : null}
              </span>
              <div>
                <Label htmlFor={row.numberId} className="sr-only">
                  {row.label} number
                </Label>
                <Input
                  id={row.numberId}
                  maxLength={WORKER_LIMITS.doc_number}
                  placeholder="Document number"
                  {...register(row.numberField)}
                />
              </div>
              <div>
                <Label htmlFor={row.expiryId} className="sr-only">
                  {row.label} expiry
                </Label>
                <Controller
                  name={row.expiryField}
                  control={control}
                  render={({ field }) => (
                    <FormDatePicker
                      id={row.expiryId}
                      placeholder="Expiry"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          );
        })}

        {CHECKBOX_ROWS.map((row) => (
          <div
            key={row.label}
            className={cn(GRID, "border-t border-border px-3 py-2.5")}
          >
            <span className="text-sm font-medium">{row.label}</span>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={watch(row.checkField)}
                onCheckedChange={(checked) =>
                  setValue(row.checkField, checked === true)
                }
              />
              <span>{row.checkLabel}</span>
            </label>
            <div>
              <Label htmlFor={row.expiryId} className="sr-only">
                {row.label} expiry
              </Label>
              <Controller
                name={row.expiryField}
                control={control}
                render={({ field }) => (
                  <FormDatePicker
                    id={row.expiryId}
                    placeholder="Expiry"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
