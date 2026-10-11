import type { SheetTotals } from "./types";
import { formatSheetAmount } from "./types";

type DocTotalsProps = {
  totals: SheetTotals;
  currency: string;
  grandLabel?: string;
  withOptionals?: number | null;
  totalColor?: string;
};

export function DocTotals({ totals, currency, grandLabel, withOptionals, totalColor }: DocTotalsProps) {
  const label = grandLabel ?? `Total due (${currency})`;
  return (
    <div className="totals">
      <div className="totals__inner">
        <div className="row">
          <span className="dim">Subtotal</span>
          <span className="tabular">{formatSheetAmount(totals.subtotal)}</span>
        </div>
        {totals.discount > 0 && totals.discountLabel && (
          <div className="row">
            <span className="dim">{totals.discountLabel}</span>
            <span className="tabular">−{formatSheetAmount(totals.discount)}</span>
          </div>
        )}
        {totals.taxLines.map((line) => (
          <div className="row" key={line.label}>
            <span className="dim">{line.label}</span>
            <span className="tabular">{formatSheetAmount(line.amount)}</span>
          </div>
        ))}
        {totals.tds > 0 && (
          <div className="row">
            <span className="dim">
              TDS deduction{totals.tdsRate != null ? ` (${totals.tdsRate}%)` : ""}
            </span>
            <span className="tabular">−{formatSheetAmount(totals.tds)}</span>
          </div>
        )}
        <div className="row grand" style={totalColor ? { color: totalColor } : undefined}>
          <span>{label}</span>
          <span className="tabular">{formatSheetAmount(totals.total)}</span>
        </div>
        {totals.tds > 0 && (
          <div className="row mt-0.5 text-[11px] text-muted-foreground">
            <span>Net received</span>
            <span className="tabular">{formatSheetAmount(totals.netReceived)}</span>
          </div>
        )}
        {withOptionals != null && withOptionals > 0 && (
          <div className="row mt-0.5 text-[11px] text-muted-foreground">
            <span>With optionals</span>
            <span className="tabular">+ {formatSheetAmount(withOptionals)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
