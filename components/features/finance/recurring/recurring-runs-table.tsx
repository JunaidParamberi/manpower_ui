import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { RecurringInvoiceRunRow } from "@/types";

type RecurringRunsTableProps = {
  runs: RecurringInvoiceRunRow[];
};

export function RecurringRunsTable({ runs }: RecurringRunsTableProps) {
  if (runs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No invoices generated yet. The first run happens on the next scheduled date.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Period</TableHead>
          <TableHead>Generated</TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map((run) => (
          <TableRow key={run.id}>
            <TableCell>
              {run.period_start} → {run.period_end}
            </TableCell>
            <TableCell>
              {new Date(run.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              {run.document_id ? (
                <Link
                  href={`/documents/${run.document_id}`}
                  className="hover:underline"
                >
                  Open invoice
                </Link>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <Badge variant={run.status === "failed" ? "destructive" : "secondary"}>
                  {run.status}
                </Badge>
                {run.error ? (
                  <span className="text-xs text-destructive">{run.error}</span>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
