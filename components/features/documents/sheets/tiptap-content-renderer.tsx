import React from "react";
import { safeHref } from "@/lib/documents/safe-href";
import type { TiptapDoc, TiptapNode } from "@/types";

export function TiptapContentRenderer({ doc }: { doc: TiptapDoc | null }) {
  if (!doc) return null;
  return (
    <div className="tiptap-body">
      {(doc.content ?? []).map((node, i) => (
        <React.Fragment key={i}>{renderBlock(node)}</React.Fragment>
      ))}
    </div>
  );
}

function renderBlock(node: TiptapNode): React.ReactNode {
  switch (node.type) {
    case "heading": {
      const level = Number(node.attrs?.level ?? 1);
      const content = renderInline(node.content);
      if (level === 1) return <h1 className="tiptap-h1">{content}</h1>;
      if (level === 2) return <h2 className="tiptap-h2">{content}</h2>;
      return <h3 className="tiptap-h3">{content}</h3>;
    }

    case "paragraph":
      return <p className="tiptap-p">{renderInline(node.content)}</p>;

    case "blockquote":
      return (
        <blockquote className="tiptap-blockquote">
          {(node.content ?? []).map((child, i) => (
            <React.Fragment key={i}>{renderBlock(child)}</React.Fragment>
          ))}
        </blockquote>
      );

    case "bulletList":
      return (
        <ul className="tiptap-ul">
          {(node.content ?? []).map((item, i) => (
            <li key={i} className="tiptap-li">
              {renderListItemContent(item.content)}
            </li>
          ))}
        </ul>
      );

    case "orderedList":
      return (
        <ol className="tiptap-ol">
          {(node.content ?? []).map((item, i) => (
            <li key={i} className="tiptap-li">
              {renderListItemContent(item.content)}
            </li>
          ))}
        </ol>
      );

    case "codeBlock":
      return (
        <pre className="tiptap-code-block">
          <code>{extractRawText(node.content)}</code>
        </pre>
      );

    case "horizontalRule":
      return <hr className="tiptap-hr" />;

    case "hardBreak":
      return <br />;

    case "pricingTable": {
      const attrs = node.attrs as {
        rows?: Array<{ description: string; qty: number; rate: number; id: string }>;
        currency?: string;
        showTax?: boolean;
        taxRate?: number;
      } | undefined;
      const rows = attrs?.rows ?? [];
      const currency = attrs?.currency ?? "USD";
      const showTax = attrs?.showTax ?? false;
      const taxRate = attrs?.taxRate ?? 0;
      const subtotal = rows.reduce((s, r) => s + r.qty * r.rate, 0);
      const tax = showTax ? subtotal * (taxRate / 100) : 0;
      const total = subtotal + tax;
      const fmt = (n: number) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
        }).format(n);

      return (
        <div className="tiptap-pricing-table">
          <table>
            <thead>
              <tr>
                <th className="desc">Description</th>
                <th className="num">Qty</th>
                <th className="num">Rate</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>{row.description || "—"}</td>
                  <td className="num">{row.qty}</td>
                  <td className="num">{fmt(row.rate)}</td>
                  <td className="num bold">{fmt(row.qty * row.rate)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="subtotal-row">
                <td colSpan={3} className="label">Subtotal</td>
                <td className="num">{fmt(subtotal)}</td>
              </tr>
              {showTax && (
                <tr>
                  <td colSpan={3} className="label">Tax ({taxRate}%)</td>
                  <td className="num">{fmt(tax)}</td>
                </tr>
              )}
              <tr className="total-row">
                <td colSpan={3} className="label">Total</td>
                <td className="num bold">{fmt(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    default:
      return null;
  }
}

function renderInline(nodes: TiptapNode[] | undefined): React.ReactNode {
  return (nodes ?? []).map((node, i) => (
    <React.Fragment key={i}>{renderInlineNode(node)}</React.Fragment>
  ));
}

function renderInlineNode(node: TiptapNode): React.ReactNode {
  if (node.type === "hardBreak") return <br />;
  if (node.type === "text") return renderTextNode(node);
  if (node.content) return renderInline(node.content);
  return null;
}

function renderTextNode(node: TiptapNode): React.ReactNode {
  const text = typeof node.text === "string" ? node.text : "";
  const marks = node.marks ?? [];

  let el: React.ReactNode = text;
  for (const mark of marks) {
    if (mark.type === "bold") el = <strong>{el}</strong>;
    else if (mark.type === "italic") el = <em>{el}</em>;
    else if (mark.type === "strike") el = <s>{el}</s>;
    else if (mark.type === "code") el = <code className="tiptap-inline-code">{el}</code>;
    else if (mark.type === "link") {
      // Rendered on public client pages too: only http(s) / mailto / tel.
      const href = safeHref((mark.attrs as { href?: string } | undefined)?.href);
      el = <a href={href} target="_blank" rel="noreferrer noopener">{el}</a>;
    }
  }
  return el;
}

function renderListItemContent(nodes: TiptapNode[] | undefined): React.ReactNode {
  return (nodes ?? []).map((node, i) => (
    <React.Fragment key={i}>{renderInline(node.content)}</React.Fragment>
  ));
}

function extractRawText(nodes: TiptapNode[] | undefined): string {
  return (nodes ?? [])
    .map((n) => (n.text ?? "") + extractRawText(n.content))
    .join("");
}
