import type { ClientFinancialSummary } from "@/lib/clients/client-financial-summary";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export type MoneyCell = { label: string; value: string; sub: string; alert?: boolean };

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function buildMoneyCells(
  summary: ClientFinancialSummary,
  activeProjects: number,
  doneProjects: number,
): MoneyCell[] {
  const money = (n: number) => formatCurrency(n, summary.currency);
  const paysIn =
    summary.avgDaysToPay === null
      ? { value: "—", sub: "no paid invoices yet" }
      : {
          value: plural(summary.avgDaysToPay, "day"),
          sub:
            summary.previousAvgDaysToPay === null
              ? "last paid invoices"
              : `was ${plural(summary.previousAvgDaysToPay, "day")}`,
        };
  return [
    {
      label: "Billed",
      value: money(summary.billedTotal),
      sub: [
        "lifetime",
        plural(summary.invoiceCount, "invoice"),
        summary.otherCurrencyCount > 0 ? `${summary.otherCurrencyCount} in other currencies` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    },
    summary.overdueCount > 0
      ? {
          label: "Outstanding",
          value: money(summary.outstandingTotal),
          sub: `${summary.overdueCount} overdue · ${plural(summary.oldestOverdueDays, "day")}`,
          alert: true,
        }
      : { label: "Outstanding", value: money(summary.outstandingTotal), sub: "nothing overdue" },
    { label: "Pays in", ...paysIn },
    { label: "Projects", value: `${activeProjects} active`, sub: `${doneProjects} done` },
  ];
}

/** Four money and work facts split by lines, under the client header. Not a card and not dashboard KPIs (use KpiCard there). */
export function ClientMoneyStrip({
  summary,
  activeProjects,
  doneProjects,
}: {
  summary: ClientFinancialSummary;
  activeProjects: number;
  doneProjects: number;
}) {
  const cells = buildMoneyCells(summary, activeProjects, doneProjects);
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
          <dd className={cn("truncate text-meta", cell.alert ? "text-[var(--danger)]" : "text-[var(--fg-3)]")}>
            {cell.sub}
          </dd>
        </div>
      ))}
    </dl>
  );
}
