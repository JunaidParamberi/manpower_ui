import {
  EXPIRING_SOON_DAYS,
  REQUIRED_DOCUMENT_SLOTS,
  nextExpiry,
  uploadedRequiredCount,
  workerInsured,
} from "@/lib/workers/worker-readiness";
import type { WorkerListRow } from "@/types";
import { cn } from "@/lib/utils";

export type WorkerStatCell = {
  label: string;
  value: string;
  sub: string;
  tone?: "danger" | "warning";
};

function days(n: number): string {
  return `${n} ${n === 1 ? "day" : "days"}`;
}

export function buildWorkerStatCells(worker: WorkerListRow, nowIso: string): WorkerStatCell[] {
  const total = REQUIRED_DOCUMENT_SLOTS.length;
  const uploaded = uploadedRequiredCount(worker);
  const documents: WorkerStatCell =
    uploaded === total
      ? { label: "Documents", value: `${uploaded} / ${total}`, sub: "all on file" }
      : {
          label: "Documents",
          value: `${uploaded} / ${total}`,
          sub: `${total - uploaded} missing`,
          ...(uploaded < 3 ? { tone: "warning" as const } : {}),
        };

  const expiry = nextExpiry(worker, nowIso);
  let expiryCell: WorkerStatCell;
  if (!expiry) {
    expiryCell = { label: "Next expiry", value: "—", sub: "no expiry dates entered" };
  } else if (expiry.daysLeft < 0) {
    expiryCell = {
      label: "Next expiry",
      value: expiry.label,
      sub: `expired ${days(-expiry.daysLeft)} ago`,
      tone: "danger",
    };
  } else {
    expiryCell = {
      label: "Next expiry",
      value: days(expiry.daysLeft),
      sub: expiry.label,
      ...(expiry.daysLeft <= EXPIRING_SOON_DAYS ? { tone: "warning" as const } : {}),
    };
  }

  const linked = worker.clients.length;
  const clients: WorkerStatCell = {
    label: "Clients",
    value: `${linked} linked`,
    sub: linked > 0 ? "on site" : "not assigned",
  };

  const insured = workerInsured(worker);
  const medical: WorkerStatCell = {
    label: "Medical",
    value: worker.medical_fit ? "Fit" : "Not fit",
    sub: insured ? "insured" : "no insurance",
    ...(insured ? {} : { tone: "warning" as const }),
  };

  return [documents, expiryCell, clients, medical];
}

/** Four readiness facts split by lines, under the worker header. Same markup as ClientMoneyStrip. */
export function WorkerStatStrip({ worker, nowIso }: { worker: WorkerListRow; nowIso: string }) {
  const cells = buildWorkerStatCells(worker, nowIso);
  return (
    <dl className="grid shrink-0 grid-cols-2 border-y border-border @3xl/shell:grid-cols-4">
      {cells.map((cell, i) => (
        <div
          key={cell.label}
          className={cn(
            "min-w-0 px-4 py-3.5 sm:px-6 lg:px-7",
            i % 2 === 0 && "border-r border-border",
            i < 2 && "border-b border-border @3xl/shell:border-b-0",
            i === 1 && "@3xl/shell:border-r",
          )}
        >
          <dt className="text-label font-medium uppercase tracking-[0.03em] text-[var(--fg-3)]">{cell.label}</dt>
          <dd className="mt-1 truncate font-heading text-[18px] font-semibold tabular-nums tracking-[-0.01em]">
            {cell.value}
          </dd>
          <dd
            className={cn(
              "truncate text-meta",
              cell.tone === "danger"
                ? "text-[var(--danger)]"
                : cell.tone === "warning"
                  ? "text-[var(--warning)]"
                  : "text-[var(--fg-3)]",
            )}
          >
            {cell.sub}
          </dd>
        </div>
      ))}
    </dl>
  );
}
