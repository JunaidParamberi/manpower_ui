"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pause, Play } from "lucide-react";
import { toast } from "sonner";

import {
  cancelRecurringBySourceDocument,
  pauseRecurringInvoice,
  resumeRecurringInvoice,
  upsertRecurringFromInvoice,
} from "@/lib/recurring/actions";
import {
  formatCadence,
  RECURRING_STATUS_LABELS,
} from "@/lib/recurring/display";
import type { DocumentStatus, RecurringInvoiceRow, RecurringInterval } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormDatePicker } from "@/components/shared/form-date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const FREQUENCY_OPTIONS: { value: RecurringInterval; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

type SaveState = "idle" | "saving" | "saved" | "error";

export type InvoiceRecurringSectionProps = {
  documentId: string;
  invoiceStatus: DocumentStatus;
  hasClient: boolean;
  hasLineItems: boolean;
  initialSchedule: RecurringInvoiceRow | null;
  generatedFromScheduleId: string | null;
  defaultStartDate?: string;
};

export function InvoiceRecurringSection({
  documentId,
  invoiceStatus,
  hasClient,
  hasLineItems,
  initialSchedule,
  generatedFromScheduleId,
  defaultStartDate,
}: InvoiceRecurringSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  const isGenerated = Boolean(generatedFromScheduleId);
  const isDraft = invoiceStatus === "draft";
  const canEdit = isDraft && hasClient && hasLineItems && !isGenerated;
  const hasActiveSchedule =
    initialSchedule !== null &&
    initialSchedule.status !== "cancelled";

  const [enabled, setEnabled] = useState(hasActiveSchedule);
  const [interval, setInterval] = useState<RecurringInterval>(
    initialSchedule?.interval ?? "monthly",
  );
  const [startDate, setStartDate] = useState(
    initialSchedule?.start_date ?? defaultStartDate ?? today,
  );
  const [autoSend, setAutoSend] = useState(initialSchedule?.auto_send ?? false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  function runScheduleAction(
    label: string,
    action: () => Promise<{ ok: boolean; error?: string }>,
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(label);
      router.refresh();
    });
  }

  if (isGenerated) {
    return (
      <div className="border-t border-border/60 pt-3">
        <div className="flex flex-col gap-2">
          <span className="text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
            Recurring invoice
          </span>
          <Badge variant="outline">Generated from schedule</Badge>
          <p className="text-xs text-muted-foreground">
            Auto-generated on a recurring schedule. Edit the source invoice to change
            future billing.
          </p>
        </div>
      </div>
    );
  }

  const helperText = !hasClient
    ? "Add a client before enabling recurring."
    : !hasLineItems
      ? "Add at least one line item before enabling recurring."
      : !isDraft
        ? "Schedule cadence can only be edited on draft invoices."
        : null;

  function handleToggle(checked: boolean) {
    if (!canEdit) return;

    if (!checked && hasActiveSchedule) {
      setEnabled(false);
      setSaveState("saving");
      startTransition(async () => {
        const result = await cancelRecurringBySourceDocument(documentId);
        if (!result.ok) {
          setEnabled(true);
          setSaveState("error");
          toast.error(result.error);
          return;
        }
        setSaveState("saved");
        toast.success("Recurring schedule cancelled");
        router.refresh();
      });
      return;
    }

    setEnabled(checked);
    setSaveState("idle");
  }

  function handleSave() {
    if (!canEdit || !enabled) return;

    setSaveState("saving");
    startTransition(async () => {
      const result = await upsertRecurringFromInvoice(documentId, {
        interval,
        interval_count: 1,
        start_date: startDate,
        auto_send: autoSend,
        net_days: initialSchedule?.net_days ?? 7,
      });

      if (!result.ok) {
        setSaveState("error");
        toast.error(result.error);
        return;
      }

      setSaveState("saved");
      toast.success("Recurring schedule saved");
      router.refresh();
    });
  }

  return (
    <div className="border-t border-border/60 pt-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
          Recurring invoice
        </span>
        <Switch
          id="recurring-toggle"
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={!canEdit || pending}
        />
      </div>

      {helperText ? (
        <p className="mt-2 text-xs text-muted-foreground">{helperText}</p>
      ) : null}

      {enabled && canEdit ? (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Frequency</Label>
            <Select
              value={interval}
              onValueChange={(v) => {
                if (typeof v === "string") setInterval(v as RecurringInterval);
              }}
              disabled={pending}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Start date</Label>
            <FormDatePicker
              value={startDate}
              onChange={setStartDate}
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              This invoice is the first occurrence. The next invoice generates on
              the following {interval === "daily" ? "day" : interval === "weekly" ? "week" : interval === "yearly" ? "year" : "month"}.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="recurring-auto-send" className="text-xs">
                Auto-send
              </Label>
              <p className="text-xs text-muted-foreground">
                Email client when each future invoice is generated.
              </p>
            </div>
            <Switch
              id="recurring-auto-send"
              checked={autoSend}
              onCheckedChange={setAutoSend}
              disabled={pending}
            />
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={pending}
          >
            {pending
              ? "Saving…"
              : saveState === "saved"
                ? "Saved"
                : "Save schedule"}
          </Button>
        </div>
      ) : null}

      {hasActiveSchedule && initialSchedule ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {RECURRING_STATUS_LABELS[initialSchedule.status]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatCadence(initialSchedule.interval, initialSchedule.interval_count)}
              {initialSchedule.next_run_at
                ? ` · Next ${initialSchedule.next_run_at}`
                : ""}
            </span>
          </div>
          {initialSchedule.status === "active" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() =>
                runScheduleAction("Schedule paused", () =>
                  pauseRecurringInvoice(initialSchedule.id),
                )
              }
            >
              <Pause className="size-3.5" />
              Pause schedule
            </Button>
          ) : null}
          {initialSchedule.status === "paused" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() =>
                runScheduleAction("Schedule resumed", () =>
                  resumeRecurringInvoice(initialSchedule.id),
                )
              }
            >
              <Play className="size-3.5" />
              Resume schedule
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
