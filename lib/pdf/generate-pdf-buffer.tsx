import { renderToBuffer } from "@react-pdf/renderer";
import type { SupabaseClient } from "@supabase/supabase-js";
import React from "react";

import { substituteInTiptapDoc } from "@/lib/documents/variables";
import type { VariableContext } from "@/lib/documents/variables";
import { buildInvoiceZatcaQrDataUrl } from "@/lib/documents/zatca/zatca-qr";
import { DocumentPdf } from "@/lib/pdf/document-pdf";
import { buildSheetPdfModel } from "@/lib/pdf/sheet-model";
import type { BrandKitRow, ClientRow, DocumentRow, LineItemRow, ProjectRow } from "@/types";

type ProfilePdfRow = {
  company_name: string | null;
  full_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_region: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  vat_number: string | null;
  gstin: string | null;
  vat_reg_no: string | null;
};

export type PdfRenderContext = {
  variableContext: VariableContext;
  brandKit: Pick<BrandKitRow, "logo_url" | "primary_color" | "font"> | null;
  businessName: string | null;
};

export function createSafePdfFilename(
  documentNumber: string | null | undefined,
  title: string,
): string {
  return (
    (documentNumber ?? title).replace(/[^a-zA-Z0-9_\-. ]/g, "").trim() ||
    "document"
  );
}

export async function buildPdfRenderContext(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null,
  document: Pick<DocumentRow, "client_id" | "project_id">,
): Promise<PdfRenderContext> {
  const profileQuery = supabase
    .from("profiles")
    .select(
      "company_name, full_name, address_line1, address_line2, address_city, address_region, address_postal_code, address_country, vat_number, gstin, vat_reg_no",
    )
    .eq("id", userId)
    .maybeSingle();

  const brandKitQuery = supabase
    .from("brand_kits")
    .select("logo_url, primary_color, font, email_signature")
    .eq("user_id", userId)
    .maybeSingle();

  const clientQuery = document.client_id
    ? supabase
        .from("clients")
        .select("name, contact_name, email, company, phone, address")
        .eq("id", document.client_id)
        .eq("user_id", userId)
        .maybeSingle()
    : Promise.resolve({ data: null });

  const projectQuery = document.project_id
    ? supabase
        .from("projects")
        .select("title")
        .eq("id", document.project_id)
        .eq("user_id", userId)
        .maybeSingle()
    : Promise.resolve({ data: null });

  const [profileResult, brandKitResult, clientResult, projectResult] =
    await Promise.all([profileQuery, brandKitQuery, clientQuery, projectQuery]);

  const profile = profileResult.data as ProfilePdfRow | null;
  const brandKit = brandKitResult.data as
    | (PdfRenderContext["brandKit"] & Pick<BrandKitRow, "email_signature">)
    | null;
  const client = clientResult.data as
    | Pick<ClientRow, "name" | "contact_name" | "email" | "company" | "phone" | "address">
    | null;
  const project = projectResult.data as Pick<ProjectRow, "title"> | null;
  const businessName =
    profile?.company_name?.trim() || profile?.full_name?.trim() || null;

  return {
    brandKit,
    businessName,
    variableContext: {
      client: client
        ? {
            name: client.name,
            contact_name: client.contact_name,
            email: client.email,
            company: client.company,
            phone: client.phone,
            address: client.address,
          }
        : null,
      project: project ? { title: project.title } : null,
      brand: {
        business_name: businessName,
        primary_color: brandKit?.primary_color ?? null,
        email_signature: brandKit?.email_signature ?? null,
        logo_url: brandKit?.logo_url ?? null,
      },
      sender: profile
        ? {
            name: profile.full_name?.trim() || null,
            company_name: profile.company_name?.trim() || null,
            email: userEmail,
            address_line1: profile.address_line1,
            address_line2: profile.address_line2,
            city: profile.address_city,
            region: profile.address_region,
            postal_code: profile.address_postal_code,
            country: profile.address_country,
            vat_number: profile.vat_number,
            gstin: profile.gstin,
            vat_reg_no: profile.vat_reg_no,
          }
        : null,
      now: new Date(),
    },
  };
}

function documentNumberFor(document: DocumentRow): string | null {
  if (document.type === "invoice") return document.invoice_number;
  if (document.type === "quote") return document.quote_number;
  if (document.type === "proposal") return document.proposal_number;
  if (document.type === "local_purchase_order") return document.lpo_number;
  return null;
}

export async function generateDocumentPdfBuffer(
  documentId: string,
  userId: string,
  supabase: SupabaseClient,
  userEmail: string | null = null,
): Promise<{ buffer: Buffer; filename: string } | null> {
  try {
    const { data: documentData } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", userId)
      .maybeSingle();

    const document = documentData as DocumentRow | null;
    if (!document) return null;
    if (
      document.type !== "proposal" &&
      document.type !== "quote" &&
      document.type !== "invoice" &&
      document.type !== "local_purchase_order"
    ) {
      return null;
    }

    const { data: lineItemsData } = await supabase
      .from("line_items")
      .select("*")
      .eq("document_id", documentId)
      .order("sort_order", { ascending: true });
    const lineItems = (lineItemsData ?? []) as LineItemRow[];

    const { variableContext, brandKit, businessName } =
      await buildPdfRenderContext(supabase, userId, userEmail, document);
    const resolvedContent = substituteInTiptapDoc(
      document.content_json,
      variableContext,
    );
    const currency = document.currency ?? "USD";

    const proposalData =
      document.type === "proposal"
        ? {
            proposal_number: document.proposal_number,
            notes_footer: document.notes_footer,
            proposal_content: document.proposal_content ?? null,
            line_items: lineItems,
            currency,
            discount_value: document.discount_value ?? 0,
            discount_type: document.discount_type ?? "percent",
          }
        : null;

    let sourceQuote: { number: string | null; title: string | null } | null = null;
    if (document.type === "local_purchase_order" && document.source_document_id) {
      const { data: quoteRow } = await supabase
        .from("documents")
        .select("quote_number, title")
        .eq("id", document.source_document_id)
        .eq("user_id", userId)
        .eq("type", "quote")
        .maybeSingle();
      sourceQuote = quoteRow
        ? { number: quoteRow.quote_number ?? null, title: quoteRow.title ?? null }
        : null;
    }

    // Quote / invoice / LPO: same view-model as the on-screen sheet.
    const sheetModel = buildSheetPdfModel({
      document,
      lineItems,
      variableContext,
      sourceQuote,
    });

    const zatcaQrDataUrl = document.type === "invoice"
      ? await buildInvoiceZatcaQrDataUrl({
          sellerName: businessName,
          vatNumber: variableContext.sender?.vat_number ?? null,
          sellerCountry: variableContext.sender?.country ?? null,
          taxMode: document.tax_mode,
          taxRate: document.tax_rate,
          timestamp: document.issued_at ?? document.created_at,
          lineItems,
          discountValue: document.discount_value ?? 0,
          discountType: document.discount_type ?? "percent",
        })
      : null;

    const pdfElement = (
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
                currency: proposalData.currency,
                discount_value: proposalData.discount_value,
                discount_type: proposalData.discount_type,
              }
            : null
        }
        voucherData={null}
      />
    );

    const buffer = await renderToBuffer(pdfElement);

    return {
      buffer,
      filename: createSafePdfFilename(documentNumberFor(document), document.title),
    };
  } catch (error) {
    console.error("[generateDocumentPdfBuffer] error:", error);
    return null;
  }
}
