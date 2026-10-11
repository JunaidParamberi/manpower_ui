// components/features/dashboard/queue-card.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckSquare,
  Clock,
  FileText,
  MessageSquare,
  Quote,
  Receipt,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { EmailComposerModal } from "@/components/features/communication/email-composer-modal";
import { MarkPaidButton } from "@/components/features/documents/mark-paid-button";
import { QueueSnoozeMenu } from "@/components/features/dashboard/queue-snooze-menu";
import { Button } from "@/components/ui/button";
import {
  dismissQueueItem,
  snoozeQueueItem,
  undoQueueDismissal,
} from "@/lib/dashboard/dismissal-actions";
import type { SnoozeDuration } from "@/lib/dashboard/dismissals";
import type { QueueItem, QueueSignalType } from "@/lib/dashboard/snapshot-types";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

type QueueCardProps = {
  item: QueueItem;
  /** Called after a successful snooze/dismiss so the list can drop the row. */
  onRemoved: (item: QueueItem) => void;
  /** Called when an undo succeeds, to put the row back. */
  onRestored: (item: QueueItem) => void;
  /** Storybook seam. */
  actions?: {
    snooze: typeof snoozeQueueItem;
    dismiss: typeof dismissQueueItem;
    undo: typeof undoQueueDismissal;
  };
};

const TONE: Record<QueueSignalType, { icon: LucideIcon; className: string }> = {
  overdue_invoice: { icon: AlertTriangle, className: "bg-[var(--danger-soft)] text-[var(--danger)]" },
  follow_up_due: { icon: AlertTriangle, className: "bg-[var(--danger-soft)] text-[var(--danger)]" },
  quote_not_invoiced: { icon: Receipt, className: "bg-[var(--warning-soft)] text-[var(--warning)]" },
  expiring_quote: { icon: Quote, className: "bg-[var(--warning-soft)] text-[var(--warning)]" },
  overdue_task: { icon: CheckSquare, className: "bg-[var(--danger-soft)] text-[var(--danger)]" },
  project_deadline: { icon: Clock, className: "bg-[var(--warning-soft)] text-[var(--warning)]" },
  quote_no_response: { icon: MessageSquare, className: "bg-[var(--info-soft)] text-[var(--info)]" },
  draft_unsent: { icon: FileText, className: "bg-[var(--bg-subtle)] text-[var(--fg-2)]" },
};

const PRIMARY_LABEL: Record<QueueSignalType, string> = {
  overdue_invoice: "Send reminder",
  follow_up_due: "Send reminder",
  quote_not_invoiced: "Create invoice",
  expiring_quote: "Nudge client",
  quote_no_response: "Nudge client",
  draft_unsent: "Open draft",
  overdue_task: "Open project",
  project_deadline: "Open project",
};

export function QueueCard({ item, onRemoved, onRestored, actions }: QueueCardProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [, startTransition] = useTransition();

  const snooze = actions?.snooze ?? snoozeQueueItem;
  const dismiss = actions?.dismiss ?? dismissQueueItem;
  const undo = actions?.undo ?? undoQueueDismissal;

  const tone = TONE[item.type];
  const Icon = tone.icon;
  const amountText =
    item.amount !== null && item.currency !== null
      ? formatCurrency(item.amount, item.currency)
      : null;

  const canEmail = item.clientEmail !== null;
  const isEmailPrimary =
    item.type === "overdue_invoice" ||
    item.type === "follow_up_due" ||
    item.type === "expiring_quote" ||
    item.type === "quote_no_response";

  function restore() {
    void undo({ itemType: item.type, itemId: item.id }).then((result) => {
      if (result.ok) onRestored(item);
      else toast.error(result.error ?? "Couldn't undo that");
    });
  }

  function handleSnooze(duration: SnoozeDuration) {
    onRemoved(item);
    startTransition(() => {
      void snooze({ itemType: item.type, itemId: item.id, until: duration }).then((result) => {
        if (!result.ok) {
          onRestored(item);
          toast.error(result.error ?? "Couldn't snooze that");
          return;
        }
        toast.success("Snoozed", { action: { label: "Undo", onClick: restore } });
      });
    });
  }

  function handleDismiss() {
    onRemoved(item);
    startTransition(() => {
      void dismiss({ itemType: item.type, itemId: item.id }).then((result) => {
        if (!result.ok) {
          onRestored(item);
          toast.error(result.error ?? "Couldn't dismiss that");
          return;
        }
        toast.success("Dismissed", { action: { label: "Undo", onClick: restore } });
      });
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-xs)]">
      <div className="flex min-w-0 flex-[1_1_260px] items-center gap-2.5">
        <div className={cn("grid size-7 shrink-0 place-items-center rounded-md", tone.className)}>
          <Icon size={14} strokeWidth={1.6} />
        </div>
        <div className="min-w-0 flex-1">
          {/* Title truncates; the amount never does. */}
          <p className="flex min-w-0 items-baseline gap-2 text-body font-medium text-foreground">
            <span className="truncate">{item.title}</span>
            {amountText ? (
              <span className="shrink-0 font-normal tabular-nums text-[var(--fg-2)]">{amountText}</span>
            ) : null}
          </p>
          <p className="truncate text-meta text-[var(--fg-3)]">
            {item.clientName ? `${item.clientName} · ` : ""}
            {item.detail}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {isEmailPrimary && canEmail ? (
          <Button size="sm" variant="outline" onClick={() => setComposerOpen(true)}>
            {PRIMARY_LABEL[item.type]}
          </Button>
        ) : (
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href={item.href} />}>
            {PRIMARY_LABEL[item.type]}
          </Button>
        )}

        {item.action.remainingBalance !== null && item.action.documentId ? (
          <MarkPaidButton
            documentId={item.action.documentId}
            invoiceTotal={item.action.invoiceTotal ?? 0}
            totalPaid={item.action.totalPaid ?? 0}
            totalWrittenOff={item.action.totalWrittenOff ?? 0}
            remainingBalance={item.action.remainingBalance}
            currency={item.currency ?? "USD"}
            homeCurrency={item.currency ?? "USD"}
          />
        ) : null}

        <QueueSnoozeMenu item={item} onSnooze={handleSnooze} onDismiss={handleDismiss} />
      </div>

      {canEmail ? (
        <EmailComposerModal
          open={composerOpen}
          onOpenChange={setComposerOpen}
          initialTo={item.clientEmail ?? ""}
          initialSubject={item.action.suggestedSubject ?? item.title}
          initialBody={item.action.suggestedBody ?? ""}
        />
      ) : null}
    </div>
  );
}