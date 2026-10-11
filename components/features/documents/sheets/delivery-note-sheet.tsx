import type { VariableContext } from "@/lib/documents/variables";
import type { SheetBrand, SheetSender } from "./types";
import { DocumentSheet } from "./document-sheet";
import { DocHeader } from "./doc-header";
import { DocParties } from "./doc-parties";
import { DocSignatures } from "./doc-signatures";
import { DocPageMarker } from "./doc-page-marker";

type DeliveredItem = {
  description: string;
  subDescription: string | null;
  format: string | null;
  quantity: number;
  status?: string; // defaults to "Delivered"
};

type ChecklistItem = {
  text: string;
  isChecked: boolean;
};

type DeliveryNoteSheetProps = {
  variableContext: VariableContext;
  deliveryNoteNumber: string | null;
  linkedInvoiceNumber: string | null;
  deliveredDate: string; // pre-formatted "12 May 2026"
  deliveredBy: string | null;
  receivedBy: string | null;
  filesCount: string | null;   // e.g. "38 items · 412 MB"
  fileFormats: string | null;  // e.g. "Figma, PDF, SVG, OTF"
  projectPhase: string | null;
  projectChannel: string | null;
  items: DeliveredItem[];
  checklist: ChecklistItem[];
  bundleUrl: string | null;
  bundleExpiry: string | null;
  bundleHash: string | null;
  senderIsSigned?: boolean;
  clientSignatureName: string | null;
};

export function DeliveryNoteSheet({
  variableContext,
  deliveryNoteNumber,
  linkedInvoiceNumber,
  deliveredDate,
  deliveredBy,
  receivedBy,
  filesCount,
  fileFormats,
  projectPhase,
  projectChannel,
  items,
  checklist,
  bundleUrl,
  bundleExpiry,
  bundleHash,
  senderIsSigned = false,
  clientSignatureName,
}: DeliveryNoteSheetProps) {
  const { brand, sender, client, project } = variableContext;

  const sheetBrand: SheetBrand | null = brand
    ? {
        logoUrl: brand.logo_url,
        businessName: brand.business_name,
        primaryColor: brand.primary_color,
        email: null,
        phone: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        vatNumber: null,
      }
    : null;

  const sheetSender: SheetSender | null = sender
    ? {
        name: sender.name,
        companyName: sender.company_name,
        email: sender.email,
        addressLine1: sender.address_line1,
        addressLine2: sender.address_line2,
        city: sender.city,
        region: sender.region,
        postalCode: sender.postal_code,
        country: sender.country,
        vatNumber: sender.vat_number,
      }
    : null;

  // Delivered to column
  const deliveredToLines = [
    client?.contact_name ?? null,
    client?.address ?? null,
    client?.email ?? null,
    client?.phone ?? null,
  ].filter(Boolean) as string[];

  // Project column lines
  const projectLines = [
    projectPhase ? `Phase: ${projectPhase}` : null,
    projectChannel ? `Channel: ${projectChannel}` : null,
    linkedInvoiceNumber ? `Linked invoice ${linkedInvoiceNumber}` : null,
  ].filter(Boolean) as string[];

  // Details column grid
  const detailsGrid = [
    { label: "Delivered", value: deliveredDate, bold: true },
    ...(deliveredBy ? [{ label: "By", value: deliveredBy }] : []),
    ...(receivedBy ? [{ label: "Received by", value: receivedBy }] : []),
    ...(filesCount ? [{ label: "Files", value: filesCount }] : []),
    ...(fileFormats ? [{ label: "Format", value: fileFormats }] : []),
  ];

  // Signatures
  const senderName = sheetSender?.name ?? sheetBrand?.businessName ?? null;
  const clientName = clientSignatureName ?? client?.contact_name ?? client?.name ?? null;

  return (
    <DocumentSheet>
      <DocHeader
        brand={sheetBrand}
        sender={sheetSender}
        docType="Delivery note"
        docNumber={deliveryNoteNumber}
        docNumberSub={linkedInvoiceNumber ? `for ${linkedInvoiceNumber}` : null}
        status="Handover complete"
        statusVariant="success"
      />

      <DocParties
        layout="3col"
        columns={[
          {
            label: "Delivered to",
            name: client?.company ?? client?.name ?? null,
            lines: deliveredToLines,
          },
          {
            label: "Project",
            name: project?.title ?? null,
            lines: projectLines,
          },
          {
            label: "Details",
            detailsGrid,
          },
        ]}
      />

      {/* Items table — no amount column */}
      <div className="party__label" style={{ marginBottom: 8 }}>Items delivered</div>
      <table className="items">
        <thead>
          <tr>
            <th>Description</th>
            <th className="r">Format</th>
            <th className="r">Qty</th>
            <th className="r">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>
                <div className="desc-title">{item.description}</div>
                {item.subDescription && (
                  <div className="desc-sub">{item.subDescription}</div>
                )}
              </td>
              <td className="rate">{item.format ?? "—"}</td>
              <td className="qty">{item.quantity}</td>
              <td className="total" style={{ color: "#1F8A52", fontWeight: 500 }}>
                {item.status ?? "Delivered"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Checklist + QR block */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 24 }}>
        <div>
          <div className="party__label" style={{ marginBottom: 8 }}>Acceptance checklist</div>
          <div className="checklist">
            {checklist.map((item, i) =>
              item.isChecked ? (
                <div className="item checked" key={i}>
                  <div className="box">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                  </div>
                  <div>{item.text}</div>
                </div>
              ) : (
                <div className="item" key={i}>
                  <div className="box" />
                  <div>{item.text}</div>
                </div>
              )
            )}
          </div>
        </div>

        {bundleUrl && (
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div className="qr" />
            <div style={{ fontSize: 11.5, color: "#54585F", lineHeight: 1.55 }}>
              <div className="party__label" style={{ marginBottom: 6 }}>Open delivery bundle</div>
              <div>{bundleUrl}</div>
              {bundleExpiry && <div>Expires {bundleExpiry}</div>}
              {bundleHash && (
                <span className="mono" style={{ fontSize: 11 }}>
                  SHA-256 {bundleHash}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <DocSignatures
        signatures={[
          {
            label: "Released by",
            name: senderName ?? "",
            date: null,
            isSigned: senderIsSigned,
          },
          {
            label: "Received by",
            name: clientName ?? "",
            date: null,
            isSigned: false,
          },
        ]}
      />

      <DocPageMarker
        left="This document confirms handover. It is not a tax invoice."
        right={`${deliveryNoteNumber ?? "DN"} · Page 1 of 1`}
      />
    </DocumentSheet>
  );
}
