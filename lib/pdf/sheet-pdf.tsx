/* eslint-disable jsx-a11y/alt-text */
/**
 * React-PDF page for quotes, invoices and LPOs. Draws a `PdfSheetModel`
 * (see `sheet-model.ts`) using the same measurements as
 * `styles/document-sheet.css`, scaled from the 800px web sheet to A4
 * (595pt ≈ 0.744×).
 */
import React from "react";
import { Image, Page, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

import type { SheetStatusVariant } from "@/components/features/documents/sheets/sheet-status";
import { formatSheetAmount } from "@/components/features/documents/sheets/types";
import type { PdfPartyColumn, PdfSheetModel, PdfTotalsRow } from "./sheet-model";

const C = {
  ink: "#14161A",
  muted: "#54585F",
  dim: "#898E96",
  hair: "#ECECE7",
  hairStrong: "#D9D9D2",
  pillBg: "#F4F4F1",
  successBg: "#E6F2EB",
  success: "#1F8A52",
  warnBg: "#FAF0DD",
  warn: "#B36A12",
};

const MONO = "Courier";
const DISPLAY = "Chillax";

/** `#RRGGBB` → `rgba(r,g,b,a)`. React-PDF does not read 8-digit hex. */
export function softenHex(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(53,80,224,${alpha})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const label: Style = {
  fontSize: 7.5,
  fontWeight: 600,
  letterSpacing: 0.9,
  textTransform: "uppercase",
  color: C.dim,
  marginBottom: 6,
};

function StatusPill({
  text,
  variant,
  accent,
}: {
  text: string;
  variant: SheetStatusVariant;
  accent: string;
}) {
  const palette: Record<SheetStatusVariant, { bg: string; fg: string }> = {
    default: { bg: C.pillBg, fg: C.muted },
    success: { bg: C.successBg, fg: C.success },
    warn: { bg: C.warnBg, fg: C.warn },
    accent: { bg: softenHex(accent, 0.13), fg: accent },
  };
  const { bg, fg } = palette[variant];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-end",
        gap: 4.5,
        backgroundColor: bg,
        borderRadius: 99,
        paddingVertical: 2.5,
        paddingHorizontal: 7.5,
        marginTop: 13,
      }}
    >
      <View style={{ width: 4.5, height: 4.5, borderRadius: 3, backgroundColor: fg }} />
      <Text style={{ fontSize: 8.2, fontWeight: 500, color: fg }}>{text}</Text>
    </View>
  );
}

function Header({ header, accent }: { header: PdfSheetModel["header"]; accent: string }) {
  const letter = header.orgName?.trim().charAt(0).toUpperCase() || "?";
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 18,
        marginBottom: 27,
      }}
    >
      <View style={{ flex: 1, gap: 10 }}>
        {header.logoUrl ? (
          <Image src={header.logoUrl} style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 7 }} />
        ) : (
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              backgroundColor: header.brandColor,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 13, color: "#ffffff" }}>
              {letter}
            </Text>
          </View>
        )}
        <View>
          {header.orgName ? (
            <Text style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 12, letterSpacing: -0.18, marginBottom: 2 }}>
              {header.orgName}
            </Text>
          ) : null}
          {header.metaLines.length > 0 ? (
            <Text style={{ fontSize: 8.5, color: C.muted, lineHeight: 1.5 }}>
              {header.metaLines.join(" · ")}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, letterSpacing: -0.66, lineHeight: 1 }}>
          {header.docType}
        </Text>
        {header.docNumber ? (
          <Text style={{ fontFamily: MONO, fontSize: 9, color: C.muted, marginTop: 5 }}>
            {header.docNumber}
          </Text>
        ) : null}
        <StatusPill text={header.status.label} variant={header.status.variant} accent={accent} />
      </View>
    </View>
  );
}

function Parties({ columns }: { columns: PdfPartyColumn[] }) {
  return (
    <View style={{ flexDirection: "row", gap: 21, marginBottom: 24 }}>
      {columns.map((col) => (
        <View key={col.label} style={{ flex: 1 }}>
          <Text style={label}>{col.label}</Text>
          {"details" in col ? (
            <View style={{ gap: 4.5 }}>
              {col.details.map((row) => (
                <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between", gap: 9 }}>
                  <Text style={{ fontSize: 9.3, color: C.dim }}>{row.label}</Text>
                  <Text
                    style={{
                      fontSize: 9.3,
                      fontWeight: row.bold ? 500 : 400,
                      fontFamily: row.mono ? MONO : undefined,
                    }}
                  >
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <>
              {col.name ? <Text style={{ fontSize: 10, fontWeight: 500, marginBottom: 2 }}>{col.name}</Text> : null}
              {col.lines.map((line) => (
                <Text key={line} style={{ fontSize: 9, color: C.muted, lineHeight: 1.55 }}>
                  {line}
                </Text>
              ))}
            </>
          )}
        </View>
      ))}
    </View>
  );
}

const colQty: Style = { width: 42, textAlign: "right" };
const colRate: Style = { width: 74, textAlign: "right" };
const colTotal: Style = { width: 82, textAlign: "right" };
const colHsn: Style = { width: 56, textAlign: "right" };

function LineItems({ model }: { model: PdfSheetModel }) {
  const showHsn = model.items.some((i) => i.hsnSac);
  const th: Style = {
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: C.dim,
    paddingVertical: 7.5,
  };
  const td: Style = { fontSize: 9.3, paddingVertical: 10.4 };
  return (
    <View style={{ marginBottom: 18 }}>
      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.hairStrong }}>
        <Text style={[th, { flex: 1 }]}>{model.descHeader}</Text>
        {showHsn ? <Text style={[th, colHsn]}>HSN/SAC</Text> : null}
        <Text style={[th, colQty]}>Qty</Text>
        <Text style={[th, colRate]}>Rate</Text>
        <Text style={[th, colTotal]}>{model.amountHeader}</Text>
      </View>
      {model.items.map((item) => {
        const amount = item.quantity * item.unitPrice;
        return (
          <View
            key={item.id}
            wrap={false}
            style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.hair, alignItems: "flex-start" }}
          >
            <View style={{ flex: 1, paddingVertical: 10.4, flexDirection: "row", gap: 5, alignItems: "center" }}>
              <Text style={{ fontSize: 9.3, fontWeight: 500 }}>{item.description}</Text>
              {item.isOptional ? (
                <Text style={{ fontSize: 7, color: "#3550E0", backgroundColor: "#EAEEFC", borderRadius: 99, paddingHorizontal: 5, paddingVertical: 1 }}>
                  Optional
                </Text>
              ) : null}
            </View>
            {showHsn ? <Text style={[td, colHsn, { color: C.muted }]}>{item.hsnSac ?? "—"}</Text> : null}
            <Text style={[td, colQty, { color: C.muted }]}>{item.quantity}</Text>
            <Text style={[td, colRate, { color: C.muted }]}>{formatSheetAmount(item.unitPrice)}</Text>
            <Text style={[td, colTotal, { fontWeight: 500, color: item.isOptional ? C.dim : C.ink }]}>
              {item.isOptional ? `+${formatSheetAmount(amount)}` : formatSheetAmount(amount)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function Totals({ rows }: { rows: PdfTotalsRow[] }) {
  return (
    <View wrap={false} style={{ width: 208, gap: 5.2 }}>
      {rows.map((row) =>
        row.kind === "grand" ? (
          <View
            key={row.label}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              borderTopWidth: 1,
              borderTopColor: C.hairStrong,
              paddingTop: 7.4,
              marginTop: 3,
            }}
          >
            <Text style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 13.4, letterSpacing: -0.2 }}>{row.label}</Text>
            <Text style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 13.4, letterSpacing: -0.2 }}>{row.value}</Text>
          </View>
        ) : (
          <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: row.kind === "note" ? 8.2 : 9.3, color: C.dim }}>
              {row.label}
            </Text>
            <Text style={{ fontSize: row.kind === "note" ? 8.2 : 9.3, color: row.kind === "note" ? C.dim : C.ink }}>
              {row.value}
            </Text>
          </View>
        ),
      )}
    </View>
  );
}

export function SheetPdfPage({
  model,
  fontFamily,
  zatcaQrDataUrl,
}: {
  model: PdfSheetModel;
  fontFamily: string;
  /** ZATCA Phase 1 QR — KSA VAT invoices only. */
  zatcaQrDataUrl?: string | null;
}) {
  return (
    <Page
      size="A4"
      style={{
        fontFamily,
        fontSize: 9.7,
        color: C.ink,
        backgroundColor: "#ffffff",
        paddingTop: 42,
        paddingBottom: 60,
        paddingHorizontal: 48,
        lineHeight: 1.4,
      }}
    >
      <Header header={model.header} accent={model.accent} />

      <Parties columns={model.parties} />

      {model.authorisation ? (
        <View
          wrap={false}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 18,
            borderWidth: 1,
            borderColor: C.hair,
            borderRadius: 9,
            paddingVertical: 13,
            paddingHorizontal: 18,
            marginBottom: 22,
          }}
        >
          <View style={{ flex: 1.5 }}>
            <Text style={label}>What this order authorises</Text>
            <Text style={{ fontSize: 9.3, color: C.muted, lineHeight: 1.55 }}>{model.authorisation.copy}</Text>
          </View>
          <View style={{ flex: 0.8, alignItems: "flex-end" }}>
            <Text style={label}>Authorised total</Text>
            <Text style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, letterSpacing: -0.66, lineHeight: 1.05 }}>
              {model.authorisation.total}
            </Text>
          </View>
        </View>
      ) : null}

      {model.itemsLabel ? <Text style={[label, { marginBottom: 7.5 }]}>{model.itemsLabel}</Text> : null}

      <LineItems model={model} />

      {model.terms ? (
        <View wrap={false} style={{ flexDirection: "row", gap: 24, alignItems: "flex-start", marginBottom: 18 }}>
          <View style={{ flex: 1 }}>
            <Text style={label}>Terms</Text>
            {model.terms.lines.map((t) => (
              <Text key={t} style={{ fontSize: 9, color: C.muted, lineHeight: 1.7 }}>• {t}</Text>
            ))}
            {model.terms.notes ? (
              <Text style={{ fontSize: 9, color: C.muted, lineHeight: 1.6, marginTop: 9 }}>{model.terms.notes}</Text>
            ) : null}
          </View>
          <Totals rows={model.totals} />
        </View>
      ) : (
        <View style={{ alignItems: "flex-end", marginBottom: 24 }}>
          <Totals rows={model.totals} />
        </View>
      )}

      {zatcaQrDataUrl ? (
        <View wrap={false} style={{ alignItems: "flex-end", marginBottom: 18 }}>
          <Image src={zatcaQrDataUrl} style={{ width: 86, height: 86 }} />
          <Text style={{ fontSize: 7, letterSpacing: 0.6, textTransform: "uppercase", color: C.dim, marginTop: 4 }}>
            ZATCA e-invoice QR
          </Text>
        </View>
      ) : null}

      {model.footer ? (
        <View
          wrap={false}
          style={{ flexDirection: "row", gap: 24, paddingTop: 18, borderTopWidth: 1, borderTopColor: C.hair }}
        >
          <View style={{ flex: 1.2 }}>
            <Text style={label}>Payment instructions</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={label}>Notes</Text>
            {model.footer.notes ? (
              <Text style={{ fontSize: 9, color: C.muted, lineHeight: 1.6 }}>{model.footer.notes}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      <View
        fixed
        style={{
          position: "absolute",
          bottom: 21,
          left: 48,
          right: 48,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 7.5, letterSpacing: 0.6, textTransform: "uppercase", color: C.dim }}>
          {model.marker}
        </Text>
        <Text
          style={{ fontSize: 7.5, letterSpacing: 0.6, textTransform: "uppercase", color: C.dim }}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </Page>
  );
}
