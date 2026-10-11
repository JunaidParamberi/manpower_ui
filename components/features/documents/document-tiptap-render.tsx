import { Fragment, type ReactNode } from "react";

import type { PricingRow, PricingTableAttrs } from "./editor/pricing-table-view";
import {
  isKnownVariable,
  substituteVariables,
  type VariableContext,
} from "@/lib/documents/variables";
import type { TiptapNode } from "@/types";

export function renderNode(node: TiptapNode, ctx: VariableContext, key?: number) {
  switch (node.type) {
    case "heading": {
      const level = Number((node.attrs?.level as number) ?? 1);
      const safeLevel = Math.min(Math.max(level, 1), 6);
      const children = renderInlineChildren(node.content, ctx);
      switch (safeLevel) {
        case 1:
          return <h1 key={key}>{children}</h1>;
        case 2:
          return <h2 key={key}>{children}</h2>;
        case 3:
          return <h3 key={key}>{children}</h3>;
        case 4:
          return <h4 key={key}>{children}</h4>;
        case 5:
          return <h5 key={key}>{children}</h5>;
        default:
          return <h6 key={key}>{children}</h6>;
      }
    }
    case "paragraph":
      return <p key={key}>{renderInlineChildren(node.content, ctx)}</p>;
    case "bulletList":
      return (
        <ul key={key}>
          {(node.content ?? []).map((child, i) => renderNode(child, ctx, i))}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key}>
          {(node.content ?? []).map((child, i) => renderNode(child, ctx, i))}
        </ol>
      );
    case "listItem":
      return (
        <li key={key}>
          {(node.content ?? []).map((child, i) => renderNode(child, ctx, i))}
        </li>
      );
    case "blockquote":
      return (
        <blockquote key={key}>
          {(node.content ?? []).map((child, i) => renderNode(child, ctx, i))}
        </blockquote>
      );
    case "horizontalRule":
      return <hr key={key} />;
    case "hardBreak":
      return <br key={key} />;
    case "text":
      return renderText(node, ctx, key);
    case "pricingTable":
      return renderPricingTable(node.attrs as PricingTableAttrs | undefined, key);
    default:
      return null;
  }
}

function renderPricingTable(attrs: PricingTableAttrs | undefined, key?: number): ReactNode {
  const rows: PricingRow[] = attrs?.rows ?? [];
  const currency = attrs?.currency ?? "USD";
  const showTax = attrs?.showTax ?? false;
  const taxRate = attrs?.taxRate ?? 0;
  const subtotal = rows.reduce((s, r) => s + r.qty * r.rate, 0);
  const tax = showTax ? subtotal * (taxRate / 100) : 0;
  const total = subtotal + tax;
  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(n);

  return (
    <div key={key} className="my-6 overflow-hidden rounded-xl border border-border/60">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/60">
            {["Description", "Qty", "Rate", "Total"].map((h, i) => (
              <th
                key={h}
                className={`px-3 py-2.5 text-[0.68rem] font-semibold uppercase tracking-widest text-muted-foreground ${i === 0 ? "pl-4 text-left" : "text-right"} ${i === 3 ? "pr-4" : ""}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/40">
              <td className="py-2.5 pl-4 pr-3 text-foreground">
                {row.description || (
                  <span className="italic text-muted-foreground/40">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">{row.qty}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{fmt(row.rate)}</td>
              <td className="py-2.5 pl-3 pr-4 text-right font-medium tabular-nums">
                {fmt(row.qty * row.rate)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border/60">
            <td
              colSpan={3}
              className="py-2.5 pl-4 text-right text-[0.68rem] font-medium uppercase tracking-widest text-muted-foreground"
            >
              Subtotal
            </td>
            <td className="py-2.5 pl-3 pr-4 text-right font-medium tabular-nums">
              {fmt(subtotal)}
            </td>
          </tr>
          {showTax ? (
            <tr className="border-t border-border/40">
              <td
                colSpan={3}
                className="py-2 pl-4 text-right text-[0.68rem] font-medium uppercase tracking-widest text-muted-foreground"
              >
                Tax ({taxRate}%)
              </td>
              <td className="py-2 pl-3 pr-4 text-right font-medium tabular-nums">
                {fmt(tax)}
              </td>
            </tr>
          ) : null}
          <tr className="border-t border-border/60 bg-muted/30">
            <td
              colSpan={3}
              className="py-3 pl-4 text-right text-[0.68rem] font-semibold uppercase tracking-widest text-foreground"
            >
              Total
            </td>
            <td className="py-3 pl-3 pr-4 text-right text-base font-semibold tabular-nums text-foreground">
              {fmt(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function renderInlineChildren(children: TiptapNode[] | undefined, ctx: VariableContext) {
  return (children ?? []).map((child, i) => renderNode(child, ctx, i));
}

function renderText(node: TiptapNode, ctx: VariableContext, key?: number) {
  const text = typeof node.text === "string" ? node.text : "";
  const segments = splitVariables(text);
  const inner = segments.map((seg, i) => {
    if (seg.kind === "var") {
      const resolved = substituteVariables(`{{${seg.key}}}`, ctx);
      const isResolved = resolved !== `{{${seg.key}}}`;
      if (isKnownVariable(seg.key) && isResolved) {
        return <Fragment key={i}>{resolved}</Fragment>;
      }
      return (
        <span
          key={i}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-muted-foreground"
          title={
            isKnownVariable(seg.key)
              ? "Variable not set — fill in the related client/project to resolve."
              : "Unknown variable"
          }
        >
          {`{{${seg.key}}}`}
        </span>
      );
    }
    return <Fragment key={i}>{seg.text}</Fragment>;
  });

  let wrapped: React.ReactNode = inner;
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") wrapped = <strong>{wrapped}</strong>;
    else if (mark.type === "italic") wrapped = <em>{wrapped}</em>;
    else if (mark.type === "strike") wrapped = <s>{wrapped}</s>;
    else if (mark.type === "code")
      wrapped = (
        <code className="rounded bg-muted px-1 text-[0.85em]">{wrapped}</code>
      );
    else if (mark.type === "link") {
      const href = String((mark.attrs?.href as string) ?? "#");
      wrapped = (
        <a
          href={href}
          rel="noopener noreferrer"
          target="_blank"
          className="text-primary underline underline-offset-4 hover:opacity-80"
        >
          {wrapped}
        </a>
      );
    }
  }

  return <Fragment key={key}>{wrapped}</Fragment>;
}

type Segment = { kind: "text"; text: string } | { kind: "var"; key: string };

function splitVariables(text: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = /\{\{\s*([a-z_]+)\s*\}\}/g;
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      segments.push({ kind: "text", text: text.slice(lastIndex, matchIndex) });
    }
    segments.push({ kind: "var", key: match[1] });
    lastIndex = matchIndex + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ kind: "text", text: text.slice(lastIndex) });
  }
  return segments;
}
