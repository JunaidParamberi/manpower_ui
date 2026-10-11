"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SelectionSummary } from "@/lib/time/billing-utils";

type TimeBillingBarProps = {
  summary: SelectionSummary;
  currency: string;
  pending: boolean;
  onCreate: () => void;
};

export function TimeBillingBar({ summary, currency, pending, onCreate }: TimeBillingBarProps) {
  if (summary.count === 0) return null;

  const disabled = summary.mixed || pending;

  return (
    <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
      <div className="flex flex-col text-sm">
        <span className="font-medium text-foreground">
          {summary.count} selected · {summary.totalHours}h
        </span>
        {summary.mixed ? (
          <span className="text-destructive">
            Entries span multiple clients — select one client to invoice.
          </span>
        ) : (
          <span className="text-muted-foreground">
            Estimated {currency} {summary.estTotal.toFixed(2)}
          </span>
        )}
      </div>
      <Button onClick={onCreate} disabled={disabled} className="gap-2">
        <FileText className="size-4" aria-hidden />
        {pending ? "Creating…" : "Create invoice"}
      </Button>
    </div>
  );
}
