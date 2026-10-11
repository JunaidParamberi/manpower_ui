import { AlertTriangle } from "lucide-react";
import type { LpoBillingProgress } from "@/lib/documents/lpo/billing-progress";

interface Props {
  progress: LpoBillingProgress;
  currency?: string;
  onCreateInvoice?: () => void;
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

function ProgressBar({
  pct,
  color,
}: {
  pct: number;
  color: "blue" | "green" | "amber";
}) {
  const clamped = Math.min(pct, 100);
  const colorClass =
    color === "blue"
      ? "bg-primary"
      : color === "green"
        ? "bg-green-500"
        : "bg-amber-500";

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all ${colorClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function LpoBillingProgress({ progress, currency = "AED", onCreateInvoice }: Props) {
  const { lpo_amount, invoiced_amount, paid_amount, invoiced_pct, paid_pct, over_ceiling } =
    progress;

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Billing against this LPO</h3>
        {onCreateInvoice && (
          <button
            onClick={onCreateInvoice}
            className="text-xs text-primary hover:underline"
          >
            + Create invoice
          </button>
        )}
      </div>

      {lpo_amount != null && (
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Ceiling</p>
            <p className="font-semibold">{fmt(lpo_amount, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Invoiced</p>
            <p className="font-semibold">{fmt(invoiced_amount, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Paid</p>
            <p className="font-semibold">{fmt(paid_amount, currency)}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Invoiced</span>
          <span>{invoiced_pct}%</span>
        </div>
        <ProgressBar pct={invoiced_pct} color={over_ceiling ? "amber" : "blue"} />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Paid</span>
          <span>{paid_pct}%</span>
        </div>
        <ProgressBar pct={paid_pct} color="green" />
      </div>

      {over_ceiling && (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Invoiced amount exceeds the LPO ceiling by{" "}
            {lpo_amount != null
              ? fmt(invoiced_amount - lpo_amount, currency)
              : "an unknown amount"}
            .
          </span>
        </div>
      )}
    </div>
  );
}
