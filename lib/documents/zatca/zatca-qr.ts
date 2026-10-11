import QRCode from "qrcode";

import {
  computeDocumentTax,
  roundMoney,
  type TaxMode,
} from "@/lib/documents/tax/compute-tax";
import type { LineItemRow } from "@/types";

/** ZATCA Phase 1 ("Fatoorah") applies to Saudi Arabia sellers. */
export const ZATCA_SELLER_COUNTRY = "SA";

/** Single-byte TLV length cap (BER-TLV short form). */
const MAX_TLV_VALUE_BYTES = 255;

/** The five mandatory ZATCA Phase 1 QR tags, in order. */
export type ZatcaTlvData = {
  /** Tag 1 — seller name. */
  sellerName: string;
  /** Tag 2 — seller VAT registration number (TRN). */
  vatNumber: string;
  /** Tag 3 — invoice timestamp, ISO 8601. */
  timestamp: string;
  /** Tag 4 — invoice total, VAT inclusive. */
  total: number;
  /** Tag 5 — VAT total. */
  vatTotal: number;
};

const textEncoder = new TextEncoder();

/** Truncate a string so its UTF-8 byte length fits, without splitting a code point. */
function truncateToBytes(value: string, maxBytes: number): Uint8Array {
  const bytes = textEncoder.encode(value);
  if (bytes.length <= maxBytes) return bytes;
  let end = maxBytes;
  // Don't cut in the middle of a multi-byte sequence (continuation bytes are 10xxxxxx).
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) end--;
  return bytes.subarray(0, end);
}

/** Encode a single TLV field: [tag][length][value bytes]. */
function encodeTlvField(tag: number, value: string): Uint8Array {
  const valueBytes = truncateToBytes(value, MAX_TLV_VALUE_BYTES);
  const field = new Uint8Array(2 + valueBytes.length);
  field[0] = tag;
  field[1] = valueBytes.length;
  field.set(valueBytes, 2);
  return field;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Build the Base64-encoded TLV string for a ZATCA Phase 1 QR code.
 * Generated purely locally — no network calls.
 */
export function encodeZatcaTlv({
  sellerName,
  vatNumber,
  timestamp,
  total,
  vatTotal,
}: ZatcaTlvData): string {
  const fields = [
    encodeTlvField(1, sellerName),
    encodeTlvField(2, vatNumber),
    encodeTlvField(3, timestamp),
    encodeTlvField(4, total.toFixed(2)),
    encodeTlvField(5, vatTotal.toFixed(2)),
  ];
  const totalLength = fields.reduce((sum, field) => sum + field.length, 0);
  const buffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const field of fields) {
    buffer.set(field, offset);
    offset += field.length;
  }
  return bytesToBase64(buffer);
}

/** Render a Base64 TLV string to a PNG data URL QR code. */
export async function generateZatcaQrDataUrl(base64Tlv: string): Promise<string> {
  return QRCode.toDataURL(base64Tlv, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 256,
  });
}

/** Show a ZATCA QR only for Saudi sellers charging VAT with a registered TRN. */
export function shouldShowZatcaQr({
  taxMode,
  sellerCountry,
  vatNumber,
}: {
  taxMode: TaxMode | string | null | undefined;
  sellerCountry: string | null | undefined;
  vatNumber: string | null | undefined;
}): boolean {
  return (
    taxMode === "vat" &&
    (sellerCountry ?? "").trim().toUpperCase() === ZATCA_SELLER_COUNTRY &&
    !!vatNumber &&
    vatNumber.trim().length > 0
  );
}

/** Compute the VAT-inclusive total and VAT total for an invoice's documents-level tax. */
export function computeZatcaAmounts({
  lineItems,
  discountValue = 0,
  discountType = "percent",
  taxMode,
  taxRate,
}: {
  lineItems: Pick<LineItemRow, "quantity" | "unit_price">[];
  discountValue?: number;
  discountType?: "percent" | "flat";
  taxMode: TaxMode;
  taxRate: number;
}): { total: number; vatTotal: number } {
  const subtotal = lineItems.reduce(
    (sum, li) => sum + Number(li.quantity) * Number(li.unit_price),
    0,
  );
  const discount =
    discountType === "flat"
      ? Math.min(discountValue, subtotal)
      : (subtotal * discountValue) / 100;
  const taxable = subtotal - discount;
  const { totalTax } = computeDocumentTax({
    taxableSubtotal: taxable,
    taxMode,
    taxRate,
  });
  return { total: roundMoney(taxable + totalTax), vatTotal: totalTax };
}

/**
 * High-level helper: returns a ZATCA QR data URL for an invoice, or null when
 * the document doesn't qualify (non-KSA, no VAT, or missing TRN).
 */
export async function buildInvoiceZatcaQrDataUrl({
  sellerName,
  vatNumber,
  sellerCountry,
  taxMode,
  taxRate,
  timestamp,
  lineItems,
  discountValue = 0,
  discountType = "percent",
}: {
  sellerName: string | null;
  vatNumber: string | null;
  sellerCountry: string | null;
  taxMode: TaxMode;
  taxRate: number;
  timestamp: string;
  lineItems: Pick<LineItemRow, "quantity" | "unit_price">[];
  discountValue?: number;
  discountType?: "percent" | "flat";
}): Promise<string | null> {
  if (!shouldShowZatcaQr({ taxMode, sellerCountry, vatNumber })) {
    return null;
  }
  const { total, vatTotal } = computeZatcaAmounts({
    lineItems,
    discountValue,
    discountType,
    taxMode,
    taxRate,
  });
  const base64Tlv = encodeZatcaTlv({
    sellerName: sellerName ?? "",
    vatNumber: vatNumber as string,
    timestamp,
    total,
    vatTotal,
  });
  return generateZatcaQrDataUrl(base64Tlv);
}
