"use client";

import { useRouter } from "next/navigation";
import { FileText, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  emptyExpenseFormValues,
  expenseRowToFormValues,
} from "@/lib/expenses/form-values";
import {
  createExpense,
  removeExpenseReceipt,
  updateExpense,
  uploadExpenseReceipt,
} from "@/lib/expenses/expense-mutations";
import {
  MAX_EXPENSE_RECEIPTS,
  receiptFileLabel,
} from "@/lib/expenses/receipt-utils";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_NONE_PROJECT_VALUE,
  type ExpenseCreateFormInput,
} from "@/lib/validations/expense";
import { cn } from "@/lib/utils";
import type { ExpenseListRow, ProjectListRow } from "@/types";

import { FormDatePicker } from "@/components/shared/form-date-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/shared/number-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

const RECEIPT_ACCEPT =
  "image/png,image/jpeg,image/webp,application/pdf" as const;

type ExpenseFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  defaultCurrency: string;
  projects: ProjectListRow[];
  expense?: ExpenseListRow | null;
  lockProjectId?: string | null;
  onSuccess?: () => void;
};

function projectSelectLabel(
  value: string,
  projects: ProjectListRow[],
): string {
  if (value === EXPENSE_NONE_PROJECT_VALUE || value === "") {
    return "No project";
  }
  return projects.find((p) => p.id === value)?.title ?? "Project";
}

export function ExpenseFormSheet({
  open,
  onOpenChange,
  mode,
  defaultCurrency,
  projects,
  expense,
  lockProjectId,
  onSuccess,
}: ExpenseFormSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingReceipts = expense?.receipt_urls ?? [];
  const totalAttachments = existingReceipts.length + receiptFiles.length;
  const atReceiptLimit = totalAttachments >= MAX_EXPENSE_RECEIPTS;

  const defaults =
    mode === "edit" && expense
      ? expenseRowToFormValues(expense)
      : emptyExpenseFormValues(defaultCurrency, lockProjectId ?? undefined);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ExpenseCreateFormInput>({
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!open) return;
    const next =
      mode === "edit" && expense
        ? expenseRowToFormValues(expense)
        : emptyExpenseFormValues(defaultCurrency, lockProjectId ?? undefined);
    reset(next);
    setReceiptFiles([]);
    setServerError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [open, mode, expense?.id, defaultCurrency, lockProjectId, reset, expense]);

  function applyFieldErrors(
    fieldErrors: Record<string, string[] | undefined> | undefined,
  ) {
    if (!fieldErrors) return;
    (
      Object.entries(fieldErrors) as [
        keyof ExpenseCreateFormInput,
        string[] | undefined,
      ][]
    ).forEach(([key, msgs]) => {
      const msg = msgs?.[0];
      if (msg) setError(key, { message: msg });
    });
  }

  async function uploadReceiptsIfNeeded(expenseId: string) {
    if (receiptFiles.length === 0) return true;
    const fd = new FormData();
    for (const file of receiptFiles) {
      fd.append("receipt", file);
    }
    const uploaded = await uploadExpenseReceipt(expenseId, fd);
    if (!uploaded.ok) {
      toast.error(uploaded.message);
      return false;
    }
    return true;
  }

  function onSubmit(values: ExpenseCreateFormInput) {
    setServerError(null);
    clearErrors();
    startTransition(async () => {
      if (mode === "create") {
        const created = await createExpense(values);
        if (!created.ok) {
          setServerError(created.message);
          applyFieldErrors(created.fieldErrors);
          return;
        }
        const receiptOk = await uploadReceiptsIfNeeded(created.expense.id);
        toast.success(
          receiptOk ? "Expense created" : "Expense saved; attachment upload failed.",
        );
        onOpenChange(false);
        onSuccess?.();
        router.refresh();
        return;
      }

      if (!expense) return;

      const updated = await updateExpense({ ...values, id: expense.id });
      if (!updated.ok) {
        setServerError(updated.message);
        applyFieldErrors(updated.fieldErrors);
        return;
      }

      const receiptOk = await uploadReceiptsIfNeeded(updated.expense.id);
      toast.success(
        receiptOk ? "Expense updated" : "Expense updated; attachment upload failed.",
      );
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    });
  }

  function handleRemoveExistingReceipt(url: string) {
    if (!expense) return;
    startTransition(async () => {
      const result = await removeExpenseReceipt(expense.id, url);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Attachment removed");
      router.refresh();
    });
  }

  function mergeReceiptFiles(incoming: FileList | File[]) {
    const next = [...receiptFiles];
    for (const file of Array.from(incoming)) {
      if (file.size === 0) continue;
      const duplicate = next.some(
        (f) => f.name === file.name && f.size === file.size,
      );
      if (!duplicate) next.push(file);
    }
    const room = MAX_EXPENSE_RECEIPTS - existingReceipts.length;
    setReceiptFiles(next.slice(0, Math.max(0, room)));
  }

  function removePendingReceipt(index: number) {
    setReceiptFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const projectLocked = Boolean(lockProjectId);
  const lockedProjectTitle = lockProjectId
    ? projects.find((p) => p.id === lockProjectId)?.title
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 border-s border-border/80 p-0 shadow-2xl sm:max-w-md"
      >
        <SheetHeader className="shrink-0 border-b border-border/60 px-6 pt-6 pb-5">
          <SheetTitle className="font-heading text-xl tracking-tight">
            {mode === "create" ? "Add expense" : "Edit expense"}
          </SheetTitle>
          <SheetDescription className="text-pretty leading-relaxed">
            Track business spending and attach receipts for your records.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <form
            id="expense-form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="px-6 py-6"
          >
            {serverError ? (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Could not save</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <FieldSet>
              <FieldLegend variant="label" className="sr-only">
                Expense details
              </FieldLegend>

              <FieldGroup className="gap-5">
                <Field data-invalid={errors.category ? true : undefined}>
                  <FieldLabel htmlFor="expense-category">Category</FieldLabel>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          if (v) field.onChange(v);
                        }}
                      >
                        <SelectTrigger
                          id="expense-category"
                          className="w-full min-w-0"
                          aria-invalid={errors.category ? true : undefined}
                        >
                          <span className="truncate text-start">
                            {EXPENSE_CATEGORY_LABELS[field.value] ?? "Category"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {EXPENSE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {EXPENSE_CATEGORY_LABELS[cat]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[errors.category]} />
                </Field>

                <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-3">
                  <Field data-invalid={errors.amount ? true : undefined}>
                    <FieldLabel htmlFor="expense-amount">Amount</FieldLabel>
                    <NumberInput
                      id="expense-amount"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="tabular-nums"
                      aria-invalid={errors.amount ? true : undefined}
                      {...register("amount")}
                    />
                    <FieldError errors={[errors.amount]} />
                  </Field>
                  <Field data-invalid={errors.currency ? true : undefined}>
                    <FieldLabel htmlFor="expense-currency">Currency</FieldLabel>
                    <Input
                      id="expense-currency"
                      maxLength={3}
                      placeholder="USD"
                      className="uppercase tabular-nums"
                      aria-invalid={errors.currency ? true : undefined}
                      {...register("currency")}
                    />
                    <FieldError errors={[errors.currency]} />
                  </Field>
                </div>

                <Field data-invalid={errors.date ? true : undefined}>
                  <FieldLabel htmlFor="expense-date">Date</FieldLabel>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <FormDatePicker
                        id="expense-date"
                        value={field.value}
                        onChange={field.onChange}
                        aria-invalid={errors.date ? true : undefined}
                      />
                    )}
                  />
                  <FieldError errors={[errors.date]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="expense-project">Project</FieldLabel>
                  <Controller
                    name="project_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          if (v) field.onChange(v);
                        }}
                        disabled={projectLocked}
                      >
                        <SelectTrigger
                          id="expense-project"
                          className="w-full min-w-0"
                          disabled={projectLocked}
                        >
                          <span className="truncate text-start">
                            {projectSelectLabel(field.value, projects)}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value={EXPENSE_NONE_PROJECT_VALUE}>
                              No project
                            </SelectItem>
                            {projects.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.title}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {projectLocked && lockedProjectTitle ? (
                    <FieldDescription>
                      Linked to {lockedProjectTitle} from this project.
                    </FieldDescription>
                  ) : (
                    <FieldDescription>
                      Optional — tie this expense to a client project.
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="expense-vendor">Vendor</FieldLabel>
                  <Input
                    id="expense-vendor"
                    placeholder="e.g. Adobe, Emirates"
                    autoComplete="organization"
                    {...register("vendor")}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="expense-notes">Notes</FieldLabel>
                  <Textarea
                    id="expense-notes"
                    rows={3}
                    placeholder="What was this for?"
                    className="min-h-[5rem] resize-y bg-background"
                    {...register("notes")}
                  />
                </Field>

                <FieldSeparator>Receipt</FieldSeparator>

                <Field>
                  <FieldLabel htmlFor="expense-receipt">Attachments</FieldLabel>
                  {!atReceiptLimit ? (
                  <button
                    type="button"
                    className={cn(
                      "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/25 px-4 py-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      receiptFiles.length > 0 && "border-primary/30 bg-primary/5",
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files?.length) {
                        mergeReceiptFiles(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {receiptFiles.length > 0 ? (
                      <FileText className="text-primary" aria-hidden />
                    ) : (
                      <Upload className="text-muted-foreground" aria-hidden />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {receiptFiles.length > 0
                        ? `${receiptFiles.length} file${receiptFiles.length === 1 ? "" : "s"} ready to upload`
                        : "Click or drag files here"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PNG, JPEG, WebP, or PDF · max 5 MB each · up to{" "}
                      {MAX_EXPENSE_RECEIPTS} total
                    </span>
                    <input
                      ref={fileInputRef}
                      id="expense-receipt"
                      type="file"
                      accept={RECEIPT_ACCEPT}
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          mergeReceiptFiles(e.target.files);
                        }
                        e.target.value = "";
                      }}
                    />
                  </button>
                  ) : (
                    <FieldDescription>
                      Maximum of {MAX_EXPENSE_RECEIPTS} attachments reached.
                    </FieldDescription>
                  )}
                  {existingReceipts.length > 0 ? (
                    <ul className="flex flex-col gap-2 pt-2">
                      {existingReceipts.map((url) => (
                        <li
                          key={url}
                          className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                        >
                          <FileText
                            className="shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 flex-1 truncate text-sm text-primary underline-offset-4 hover:underline"
                          >
                            {receiptFileLabel(url)}
                          </a>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            aria-label={`Remove ${receiptFileLabel(url)}`}
                            onClick={() => handleRemoveExistingReceipt(url)}
                            disabled={isPending}
                          >
                            <X aria-hidden />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {receiptFiles.length > 0 ? (
                    <ul className="flex flex-col gap-2 pt-2">
                      {receiptFiles.map((file, index) => (
                        <li
                          key={`${file.name}-${file.size}-${index}`}
                          className="flex items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2"
                        >
                          <FileText
                            className="shrink-0 text-primary"
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {file.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0"
                            aria-label={`Remove ${file.name} from upload queue`}
                            onClick={() => removePendingReceipt(index)}
                          >
                            <X aria-hidden />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {totalAttachments === 0 ? (
                    <FieldDescription>
                      Attach invoices, receipts, or PDFs — stored securely on
                      this expense.
                    </FieldDescription>
                  ) : (
                    <FieldDescription>
                      {totalAttachments} of {MAX_EXPENSE_RECEIPTS} attachments.
                    </FieldDescription>
                  )}
                </Field>
              </FieldGroup>
            </FieldSet>
          </form>
        </ScrollArea>

        <SheetFooter className="shrink-0 border-t border-border/60 bg-background/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="expense-form"
              disabled={isPending}
              className="sm:min-w-[9rem]"
            >
              {isPending
                ? "Saving…"
                : mode === "create"
                  ? "Add expense"
                  : "Save changes"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
