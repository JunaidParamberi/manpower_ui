import React from "react";
import { Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

import type { TiptapNode } from "@/types";
import type { PdfStyles } from "./styles";

type RenderCtx = {
  styles: PdfStyles;
  primaryColor: string;
};

export function renderTiptapContent(
  nodes: TiptapNode[] | undefined,
  ctx: RenderCtx,
): React.ReactElement {
  return (
    <View style={ctx.styles.content}>
      {(nodes ?? []).map((node, i) => (
        <React.Fragment key={i}>{renderBlock(node, ctx)}</React.Fragment>
      ))}
    </View>
  );
}

function renderBlock(node: TiptapNode, ctx: RenderCtx): React.ReactNode {
  switch (node.type) {
    case "heading": {
      const level = Number((node.attrs?.level as number) ?? 1);
      const style =
        level === 1
          ? ctx.styles.h1
          : level === 2
            ? ctx.styles.h2
            : ctx.styles.h3;
      return <Text style={style}>{renderInline(node.content, ctx)}</Text>;
    }

    case "paragraph":
      return (
        <Text style={ctx.styles.p}>{renderInline(node.content, ctx)}</Text>
      );

    case "blockquote":
      return (
        <View style={ctx.styles.blockquote}>
          {(node.content ?? []).map((child, i) => (
            <React.Fragment key={i}>{renderBlock(child, ctx)}</React.Fragment>
          ))}
        </View>
      );

    case "bulletList":
      return (
        <View>
          {(node.content ?? []).map((item, i) => (
            <View key={i} style={ctx.styles.listItem}>
              <Text style={ctx.styles.listBullet}>•</Text>
              <Text style={ctx.styles.listText}>
                {renderListItemContent(item.content, ctx)}
              </Text>
            </View>
          ))}
        </View>
      );

    case "orderedList":
      return (
        <View>
          {(node.content ?? []).map((item, i) => (
            <View key={i} style={ctx.styles.listItem}>
              <Text style={ctx.styles.listBullet}>{i + 1}.</Text>
              <Text style={ctx.styles.listText}>
                {renderListItemContent(item.content, ctx)}
              </Text>
            </View>
          ))}
        </View>
      );

    case "codeBlock":
      return (
        <View style={ctx.styles.codeBlock}>
          <Text>{extractRawText(node.content)}</Text>
        </View>
      );

    case "horizontalRule":
      return <View style={ctx.styles.hr} />;

    case "hardBreak":
      return <Text>{"\n"}</Text>;

    case "text":
      return <Text style={ctx.styles.p}>{renderTextNode(node, ctx)}</Text>;

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
        new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(n);

      const col = { description: { flex: 1 }, qty: { width: 36 }, rate: { width: 60 }, total: { width: 70 } };
      const headerCell = { fontSize: 7, fontWeight: 700 as const, color: "#71717a", textTransform: "uppercase" as const };
      const bodyCell = { fontSize: 9 };
      const border = { borderBottomWidth: 1, borderBottomColor: "#e4e4e7" };

      return (
        <View style={{ marginVertical: 10, borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 4 }}>
          {/* Header */}
          <View style={{ flexDirection: "row", backgroundColor: "#f4f4f5", ...border, padding: 6 }}>
            <Text style={{ ...col.description, ...headerCell }}>Description</Text>
            <Text style={{ ...col.qty, ...headerCell, textAlign: "right" }}>Qty</Text>
            <Text style={{ ...col.rate, ...headerCell, textAlign: "right" }}>Rate</Text>
            <Text style={{ ...col.total, ...headerCell, textAlign: "right" }}>Total</Text>
          </View>
          {/* Rows */}
          {rows.map((row, i) => (
            <View key={i} style={{ flexDirection: "row", ...border, padding: 6 }}>
              <Text style={{ ...col.description, ...bodyCell }}>{row.description || "—"}</Text>
              <Text style={{ ...col.qty, ...bodyCell, textAlign: "right" }}>{row.qty}</Text>
              <Text style={{ ...col.rate, ...bodyCell, textAlign: "right" }}>{fmt(row.rate)}</Text>
              <Text style={{ ...col.total, ...bodyCell, textAlign: "right", fontWeight: 700 }}>{fmt(row.qty * row.rate)}</Text>
            </View>
          ))}
          {/* Subtotal */}
          <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e4e4e7", padding: 6 }}>
            <Text style={{ flex: 1 }} />
            <Text style={{ width: 60, fontSize: 8, color: "#71717a", textAlign: "right", textTransform: "uppercase" }}>Subtotal</Text>
            <Text style={{ ...col.total, fontSize: 9, textAlign: "right" }}>{fmt(subtotal)}</Text>
          </View>
          {showTax && (
            <View style={{ flexDirection: "row", padding: 6 }}>
              <Text style={{ flex: 1 }} />
              <Text style={{ width: 60, fontSize: 8, color: "#71717a", textAlign: "right", textTransform: "uppercase" }}>Tax ({taxRate}%)</Text>
              <Text style={{ ...col.total, fontSize: 9, textAlign: "right" }}>{fmt(tax)}</Text>
            </View>
          )}
          {/* Total */}
          <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e4e4e7", backgroundColor: "#fafafa", padding: 6, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }}>
            <Text style={{ flex: 1 }} />
            <Text style={{ width: 60, fontSize: 9, fontWeight: 700, textAlign: "right", textTransform: "uppercase" }}>Total</Text>
            <Text style={{ ...col.total, fontSize: 10, fontWeight: 700, textAlign: "right" }}>{fmt(total)}</Text>
          </View>
        </View>
      );
    }

    default:
      return null;
  }
}

// Renders inline children inside a wrapping <Text> — returns React nodes
// that must themselves be <Text> or strings for react-pdf inline flow.
function renderInline(
  nodes: TiptapNode[] | undefined,
  ctx: RenderCtx,
): React.ReactNode {
  return (nodes ?? []).map((node, i) => (
    <React.Fragment key={i}>{renderInlineNode(node, ctx)}</React.Fragment>
  ));
}

function renderInlineNode(node: TiptapNode, ctx: RenderCtx): React.ReactNode {
  if (node.type === "hardBreak") return "\n";
  if (node.type === "text") return renderTextNode(node, ctx);
  // Nested inline content (e.g. inline nodes inside list items)
  if (node.content) return renderInline(node.content, ctx);
  return null;
}

function renderTextNode(node: TiptapNode, ctx: RenderCtx): React.ReactNode {
  const text = typeof node.text === "string" ? node.text : "";
  const marks = node.marks ?? [];

  let fontWeight: number | undefined;
  let fontStyle: "italic" | "normal" | undefined;
  let color: string | undefined;
  let fontFamily: string | undefined;
  let backgroundColor: string | undefined;
  let textDecoration: "line-through" | undefined;

  for (const mark of marks) {
    if (mark.type === "bold") fontWeight = 700;
    if (mark.type === "italic") fontStyle = "italic";
    if (mark.type === "strike") textDecoration = "line-through";
    if (mark.type === "code") {
      fontFamily = "Courier";
      backgroundColor = "#f4f4f5";
    }
    if (mark.type === "link") {
      color = ctx.primaryColor;
    }
  }

  const style: Style = {};
  if (fontWeight) style.fontWeight = fontWeight;
  if (fontStyle) style.fontStyle = fontStyle;
  if (color) style.color = color;
  if (fontFamily) style.fontFamily = fontFamily;
  if (backgroundColor) style.backgroundColor = backgroundColor;
  if (textDecoration) style.textDecoration = textDecoration;

  return <Text style={style}>{text}</Text>;
}

// List items contain paragraph nodes — extract their inline content flatly.
function renderListItemContent(
  nodes: TiptapNode[] | undefined,
  ctx: RenderCtx,
): React.ReactNode {
  return (nodes ?? []).map((node, i) => (
    <React.Fragment key={i}>{renderInline(node.content, ctx)}</React.Fragment>
  ));
}

function extractRawText(nodes: TiptapNode[] | undefined): string {
  return (nodes ?? [])
    .map((n) => (n.text ?? "") + extractRawText(n.content))
    .join("");
}
