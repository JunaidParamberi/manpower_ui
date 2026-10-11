"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MoreHorizontal, Pause, Play, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cancelRecurringInvoice,
  pauseRecurringInvoice,
  resumeRecurringInvoice,
} from "@/lib/recurring/actions";
import {
  formatCadence,
  recurringSubtotal,
  RECURRING_STATUS_LABELS,
} from "@/lib/recurring/display";
import { formatCurrency } from "@/lib/utils/format";
import type { RecurringInvoiceListRow } from "@/types";

type RecurringInvoicesTableProps = {
  schedules: RecurringInvoiceListRow[];
};

function statusVariant(
  status: RecurringInvoiceListRow["status"],
): "default" | "secondary" | "outline" {
  if (status === "active") return "default";
  if (status === "paused") return "secondary";
  return "outline";
}

export function RecurringInvoicesTable({ schedules }: RecurringInvoicesTableProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function runAction(
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Cadence</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Next run</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedules.map((schedule) => (
          <TableRow key={schedule.id}>
            <TableCell>
              <Link
                href={`/finance/recurring/${schedule.id}`}
                className="font-medium hover:underline"
              >
                {schedule.title}
              </Link>
            </TableCell>
            <TableCell>{schedule.client?.name ?? "—"}</TableCell>
            <TableCell>
              {formatCadence(schedule.interval, schedule.interval_count)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(
                recurringSubtotal(schedule.line_items),
                schedule.currency,
              )}
            </TableCell>
            <TableCell>{schedule.next_run_at ?? "—"}</TableCell>
            <TableCell>
              <Badge variant={statusVariant(schedule.status)}>
                {RECURRING_STATUS_LABELS[schedule.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" aria-label="Actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    render={<Link href={`/finance/recurring/${schedule.id}/edit`} />}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={<Link href={`/finance/recurring/${schedule.id}`} />}
                  >
                    View runs
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {schedule.status === "active" ? (
                    <DropdownMenuItem
                      onClick={() =>
                        runAction("Paused", () =>
                          pauseRecurringInvoice(schedule.id),
                        )
                      }
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </DropdownMenuItem>
                  ) : null}
                  {schedule.status === "paused" ? (
                    <DropdownMenuItem
                      onClick={() =>
                        runAction("Resumed", () =>
                          resumeRecurringInvoice(schedule.id),
                        )
                      }
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Resume
                    </DropdownMenuItem>
                  ) : null}
                  {schedule.status !== "cancelled" ? (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() =>
                        runAction("Cancelled", () =>
                          cancelRecurringInvoice(schedule.id),
                        )
                      }
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
