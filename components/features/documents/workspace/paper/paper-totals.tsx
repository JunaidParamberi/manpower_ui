"use client";

import type { ReactNode } from "react";
import type { DocumentTotals } from "@/lib/documents/compute-document-totals";

const money = (currency: string, n: number) =>
  `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const linkCls =
  "rounded-[5px] px-1 tabular-nums outline-1 outline-dashed outline-transparent hover:outline-[var(--sheet-line-strong)] focus-visible:outline-solid focus-visible:outline-[var(--sheet-accent)]";
const addCls = "py-0.5 text-left text-[12px] text-[var(--sheet-accent)]";

/** Totals on the paper. "+ Add discount/tax" and the amounts jump to the matching rail control. */
export function PaperTotals({
  totals, currency, discountLabel, taxLabel, tds, readOnly, onFocusDiscount, onFocusTax,
}: {
  totals: DocumentTotals;
  currency: string;
  discountLabel: string | null;
  taxLabel: string | null;
  tds?: { rate: number; amount: number } | null;
  readOnly: boolean;
  onFocusDiscount: () => void;
  onFocusTax: () => void;
}) {
  const row = (label: string, value: ReactNode, key: string) => (
    <div className="row" key={key}>
      <span className="dim">{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
  return (
    <div className="totals">
      <div className="totals__inner">
        {row("Subtotal", money(currency, totals.subtotal), "sub")}
        {discountLabel
          ? row(
              discountLabel,
              readOnly ? `− ${money(currency, totals.discount)}` : (
                <button type="button" className={linkCls} onClick={onFocusDiscount}>− {money(currency, totals.discount)}</button>
              ),
              "disc",
            )
          : !readOnly ? <button type="button" key="add-disc" className={addCls} onClick={onFocusDiscount}>+ Add discount</button> : null}
        {taxLabel
          ? row(
              taxLabel,
              readOnly ? money(currency, totals.taxTotal) : (
                <button type="button" className={linkCls} onClick={onFocusTax}>{money(currency, totals.taxTotal)}</button>
              ),
              "tax",
            )
          : !readOnly ? <button type="button" key="add-tax" className={addCls} onClick={onFocusTax}>+ Add tax</button> : null}
        <div className="row grand">
          <span>Total</span>
          <span className="tabular">{money(currency, totals.total)}</span>
        </div>
        {tds ? row(`TDS ${tds.rate}% withheld`, <span className="text-[var(--danger)]">− {money(currency, tds.amount)}</span>, "tds") : null}
        {tds ? row("Amount payable", <b>{money(currency, totals.total - tds.amount)}</b>, "payable") : null}
      </div>
    </div>
  );
}
