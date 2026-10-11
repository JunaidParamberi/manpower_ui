import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { after } from "next/server";

import { getBrandKit } from "@/lib/brand-kit/actions";
import { getDocumentById } from "@/lib/documents/document-queries";
import { getInvoiceWithLineItems } from "@/lib/documents/invoice-queries";
import { getReceiptData } from "@/lib/documents/receipt-queries";
import { getProposalWithLineItems } from "@/lib/documents/proposal-queries";
import { getQuoteWithLineItems } from "@/lib/documents/quote-queries";
import { getLpoWithLineItems } from "@/lib/documents/lpo-queries";
import { substituteInTiptapDoc } from "@/lib/documents/variables";
import { buildVariableContext } from "@/lib/documents/variables-server";
import { buildInvoiceZatcaQrDataUrl } from "@/lib/documents/zatca/zatca-qr";
import { DocumentPdf } from "@/lib/pdf/document-pdf";
import { ProposalPdf } from "@/lib/pdf/proposal-pdf";
import { buildSheetPdfModel } from "@/lib/pdf/sheet-model";
import { uploadDocumentPdf } from "@/lib/pdf/storage";
import { createClient } from "@/lib/supabase/server";

// Force Node.js runtime — @react-pdf/renderer requires Node (not Edge).
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
  const { id } = await params;

  // Auth check.
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Fetch document (RLS guarantees ownership).
  const document = await getDocumentById(id);
  if (!document) {
    return new Response("Not found", { status: 404 });
  }

  // Use document's snapshotted currency (set at creation time).
  const docCurrency = document.currency ?? "USD";

  // Fetch all type-specific data, brand kit, and variable context in parallel.
  const [
    invoiceData,
    quoteData,
    proposalData,
    voucherData,
    lpoData,
    brandResult,
    variableContext,
  ] = await Promise.all([
    document.type === "invoice" ? getInvoiceWithLineItems(id) : null,
    document.type === "quote" ? getQuoteWithLineItems(id) : null,
    document.type === "proposal" ? getProposalWithLineItems(id) : null,
    document.type === "receipt" ? getReceiptData(id) : null,
    document.type === "local_purchase_order" ? getLpoWithLineItems(id) : null,
    getBrandKit(),
    buildVariableContext({ clientId: document.client_id, projectId: document.project_id }),
  ]);

  const brandKit =
    brandResult.ok && brandResult.brandKit ? brandResult.brandKit : null;

  const resolvedContent = substituteInTiptapDoc(
    document.content_json,
    variableContext,
  );

  // Business name from variableContext.sender (already fetched above — no extra round trip).
  const businessName =
    variableContext.sender?.company_name?.trim() ||
    variableContext.sender?.name?.trim() ||
    null;

  // ZATCA Phase 1 QR — KSA VAT invoices only (returns null otherwise).
  const zatcaQrDataUrl =
    invoiceData
      ? await buildInvoiceZatcaQrDataUrl({
          sellerName: businessName,
          vatNumber: variableContext.sender?.vat_number ?? null,
          sellerCountry: variableContext.sender?.country ?? null,
          taxMode: document.tax_mode,
          taxRate: document.tax_rate,
          timestamp: document.issued_at ?? document.created_at,
          lineItems: invoiceData.line_items,
          discountValue: invoiceData.discount_value ?? 0,
          discountType: invoiceData.discount_type ?? "percent",
        })
      : null;

  // Quote / invoice / LPO: same view-model as the on-screen sheet.
  const sheetModel = buildSheetPdfModel({
    document,
    lineItems:
      invoiceData?.line_items ?? quoteData?.line_items ?? lpoData?.line_items ?? [],
    variableContext,
    sourceQuote: lpoData
      ? { number: lpoData.source_quote_number, title: lpoData.source_quote_title }
      : null,
  });

  // Render PDF.
  let pdfBuffer: Buffer;
  try {
    // Proposals use a dedicated renderer with cover page + structured sections.
    const pdfElement =
      document.type === "proposal" && proposalData ? (
        <ProposalPdf
          document={document}
          variableContext={variableContext}
          brandLogoUrl={brandKit?.logo_url ?? null}
          businessName={businessName}
          proposalData={{
            proposal_number: proposalData.proposal_number,
            notes_footer: proposalData.notes_footer,
            proposal_content: proposalData.proposal_content ?? null,
          }}
        />
      ) : (
        <DocumentPdf
          document={document}
          content={resolvedContent}
          variableContext={variableContext}
          brandLogoUrl={brandKit?.logo_url ?? null}
          primaryColor={brandKit?.primary_color ?? null}
          brandFont={brandKit?.font ?? null}
          businessName={businessName}
          zatcaQrDataUrl={zatcaQrDataUrl}
          sheetModel={sheetModel}
          proposalData={
            proposalData
              ? {
                  proposal_number: proposalData.proposal_number,
                  notes_footer: proposalData.notes_footer,
                  line_items: proposalData.line_items,
                  currency: docCurrency,
                  discount_value: proposalData.discount_value ?? 0,
                  discount_type: proposalData.discount_type ?? "percent",
                }
              : null
          }
          voucherData={voucherData}
        />
      );

    pdfBuffer = await renderToBuffer(pdfElement);
  } catch (err) {
    console.error("[api/documents/pdf] render error:", err);
    return new Response("Failed to generate PDF", { status: 500 });
  }

  // Upload to Storage asynchronously (non-blocking, best-effort).
  // after() keeps the upload alive past the response. A bare floating promise
  // is killed when the serverless function is frozen, so the stored PDF was
  // usually never written.
  after(async () => {
    try {
      await uploadDocumentPdf(user.id, document.id, pdfBuffer);
    } catch (err) {
      console.error("[api/documents/pdf] upload failed:", err);
    }
  });

  const docNumber =
    document.type === "invoice"
      ? (invoiceData?.invoice_number ?? null)
      : document.type === "quote"
      ? (quoteData?.quote_number ?? null)
      : document.type === "proposal"
      ? (proposalData?.proposal_number ?? null)
      : document.type === "local_purchase_order"
      ? (lpoData?.lpo_number ?? null)
      : null;
  const safeTitle = (docNumber ?? document.title)
    .replace(/[^a-zA-Z0-9_\-. ]/g, "")
    .trim() || "document";

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
  } catch (err) {
    console.error("[api/documents/pdf] unhandled error:", err);
    return new Response("PDF generation failed", { status: 500 });
  }
}
