"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PricingRow {
  id: string;
  description: string;
  qty: number;
  rate: number;
}

export interface PricingTableAttrs {
  rows: PricingRow[];
  currency: string;
  taxRate: number;
  showTax: boolean;
}

const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);

export function PricingTableView({ node, editor, selected }: NodeViewProps) {
  const attrs = node.attrs as PricingTableAttrs & { id: string };
  const tableId = attrs.id as string;

  const [rows, setRows] = useState<PricingRow[]>(() => attrs.rows ?? defaultRows());
  const [currency] = useState(attrs.currency || "USD");
  const [taxRate, setTaxRate] = useState(attrs.taxRate ?? 0);
  const [showTax, setShowTax] = useState(attrs.showTax ?? false);

  // Write current state to extension storage so TiptapEditor.getJSON() can read it
  const ext = (editor.storage as unknown as Record<string, { tables: Record<string, PricingTableAttrs> }>);

  const writeToStorage = (
    nextRows: PricingRow[],
    nextShowTax: boolean,
    nextTaxRate: number,
  ) => {
    if (!tableId || !ext.pricingTable) return;
    ext.pricingTable.tables[tableId] = {
      rows: nextRows,
      currency,
      showTax: nextShowTax,
      taxRate: nextTaxRate,
    };
  };

  // Initialize storage on mount so loaded documents are readable
  useEffect(() => {
    writeToStorage(rows, showTax, taxRate);
    // Cleanup on unmount
    return () => {
      if (ext.pricingTable?.tables) {
        delete ext.pricingTable.tables[tableId];
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);

  const updateRow = (id: string, field: keyof PricingRow, value: string | number) => {
    const next = rows.map((r) => (r.id === id ? { ...r, [field]: value } : r));
    setRows(next);
    writeToStorage(next, showTax, taxRate);
  };

  const addRow = () => {
    const next = [...rows, { id: uid(), description: "", qty: 1, rate: 0 }];
    setRows(next);
    writeToStorage(next, showTax, taxRate);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    const next = rows.filter((r) => r.id !== id);
    setRows(next);
    writeToStorage(next, showTax, taxRate);
  };

  const subtotal = rows.reduce((s, r) => s + r.qty * r.rate, 0);
  const tax = showTax ? subtotal * (taxRate / 100) : 0;
  const total = subtotal + tax;

  return (
    <NodeViewWrapper
      contentEditable={false}
      className={cn(
        "my-6 rounded-xl border border-border/60 overflow-hidden select-none",
        selected && "ring-2 ring-primary/30 ring-offset-1",
      )}
    >
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/60 border-b border-border/60">
            <Th align="left" className="pl-4 w-full">Description</Th>
            <Th align="right" className="w-16">Qty</Th>
            <Th align="right" className="w-28">Rate</Th>
            <Th align="right" className="pr-4 w-28">Total</Th>
            <th className="w-9" />
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/40 group hover:bg-muted/20">
              <td className="py-1.5 pl-4 pr-2">
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => updateRow(row.id, "description", e.target.value)}
                  placeholder="Item description…"
                  className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40 text-sm py-0.5 select-text"
                />
              </td>
              <td className="py-1.5 px-2 text-right">
                <input
                  type="number"
                  value={row.qty || ""}
                  onChange={(e) => updateRow(row.id, "qty", parseFloat(e.target.value) || 0)}
                  min={0}
                  step="any"
                  placeholder="1"
                  className="w-full bg-transparent outline-none text-right text-foreground placeholder:text-muted-foreground/40 text-sm py-0.5 tabular-nums select-text"
                />
              </td>
              <td className="py-1.5 px-2 text-right">
                <input
                  type="number"
                  value={row.rate || ""}
                  onChange={(e) => updateRow(row.id, "rate", parseFloat(e.target.value) || 0)}
                  min={0}
                  step="any"
                  placeholder="0.00"
                  className="w-full bg-transparent outline-none text-right text-foreground placeholder:text-muted-foreground/40 text-sm py-0.5 tabular-nums select-text"
                />
              </td>
              <td className="py-1.5 px-2 pr-4 text-right font-medium tabular-nums text-foreground">
                {fmt(row.qty * row.rate, currency)}
              </td>
              <td className="py-1.5 pr-2 text-center">
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length <= 1}
                  aria-label="Remove row"
                  className="size-6 rounded text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 inline-flex items-center justify-center disabled:opacity-0"
                >
                  <Trash2 className="size-3" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr>
            <td colSpan={5} className="pt-2.5 pb-1 pl-4">
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5"
              >
                <Plus className="size-3" />
                Add row
              </button>
            </td>
          </tr>

          <tr className="border-t border-border/60">
            <td colSpan={3} className="py-2.5 pl-4 text-right text-[0.68rem] font-medium uppercase tracking-widest text-muted-foreground">
              Subtotal
            </td>
            <td className="py-2.5 px-2 pr-4 text-right font-medium tabular-nums text-foreground">
              {fmt(subtotal, currency)}
            </td>
            <td />
          </tr>

          {showTax && (
            <tr className="border-t border-border/40">
              <td colSpan={2} className="py-2 pl-4 text-right text-[0.68rem] font-medium uppercase tracking-widest text-muted-foreground">
                Tax
              </td>
              <td className="py-2 px-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <input
                    type="number"
                    value={taxRate || ""}
                    onChange={(e) => {
                      const n = parseFloat(e.target.value) || 0;
                      setTaxRate(n);
                      writeToStorage(rows, showTax, n);
                    }}
                    min={0}
                    max={100}
                    step="0.5"
                    placeholder="0"
                    className="w-10 bg-transparent outline-none text-right text-sm tabular-nums text-foreground select-text"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </td>
              <td className="py-2 px-2 pr-4 text-right font-medium tabular-nums text-foreground">
                {fmt(tax, currency)}
              </td>
              <td />
            </tr>
          )}

          <tr className="border-t border-border/60 bg-muted/30">
            <td colSpan={2} className="py-3 pl-4">
              <button
                type="button"
                onClick={() => {
                  const next = !showTax;
                  setShowTax(next);
                  writeToStorage(rows, next, taxRate);
                }}
                className="text-[0.7rem] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showTax ? "− Remove tax" : "+ Add tax"}
              </button>
            </td>
            <td className="py-3 pr-2 text-right text-[0.68rem] font-semibold uppercase tracking-widest text-foreground">
              Total
            </td>
            <td className="py-3 px-2 pr-4 text-right font-semibold tabular-nums text-foreground text-base">
              {fmt(total, currency)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </NodeViewWrapper>
  );
}

function Th({
  children,
  align,
  className,
}: {
  children: React.ReactNode;
  align: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "py-2.5 px-2 text-[0.68rem] font-semibold uppercase tracking-widest text-muted-foreground",
        align === "right" && "text-right",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function defaultRows(): PricingRow[] {
  return [
    { id: uid(), description: "", qty: 1, rate: 0 },
    { id: uid(), description: "", qty: 1, rate: 0 },
    { id: uid(), description: "", qty: 1, rate: 0 },
  ];
}
