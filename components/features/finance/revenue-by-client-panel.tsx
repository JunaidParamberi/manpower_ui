import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { ClientRevenueRow } from "@/lib/finance/types";

type RevenueByClientPanelProps = {
  rows: ClientRevenueRow[];
  currency: string;
  dateLabel: string;
};

const DOT_CLASSES = [
  "bg-[var(--chart-1)]",
  "bg-[var(--chart-4)]",
  "bg-[var(--chart-5)]",
  "bg-[var(--info)]",
  "bg-[var(--warning)]",
  "bg-muted-foreground",
];

const PROGRESS_CLASSES = [
  "[&_[data-slot=progress-indicator]]:bg-[var(--chart-1)]",
  "[&_[data-slot=progress-indicator]]:bg-[var(--chart-4)]",
  "[&_[data-slot=progress-indicator]]:bg-[var(--chart-5)]",
  "[&_[data-slot=progress-indicator]]:bg-[var(--info)]",
  "[&_[data-slot=progress-indicator]]:bg-[var(--warning)]",
  "[&_[data-slot=progress-indicator]]:bg-muted-foreground",
];

export function RevenueByClientPanel({
  rows,
  currency,
  dateLabel,
}: RevenueByClientPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <CardTitle className="text-sm font-medium">Revenue by client</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Paid invoices · {dateLabel}</p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {rows.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 text-center">
            <p className="text-sm font-medium text-foreground">No paid revenue yet</p>
            <p className="mt-1 max-w-56 text-xs text-muted-foreground">
              Paid invoices will appear here grouped by client.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {rows.map((row, index) => (
              <div key={row.clientId} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      DOT_CLASSES[index] ?? DOT_CLASSES[0],
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {row.clientName}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {row.percentage.toFixed(row.percentage % 1 === 0 ? 0 : 1)}%
                  </span>
                </div>
                <Progress
                  value={row.percentage}
                  aria-label={`${row.clientName} revenue share`}
                  className={cn("gap-0", PROGRESS_CLASSES[index] ?? PROGRESS_CLASSES[0])}
                />
                <p className="text-xs tabular-nums text-muted-foreground">
                  {formatCurrency(row.total, currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
