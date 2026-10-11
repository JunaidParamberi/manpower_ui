/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";

import type { TiptapDoc } from "@/types";
import type { VariableContext } from "@/lib/documents/variables";
import { renderTiptapContent } from "./tiptap-to-pdf";
import { makePdfStyles } from "./styles";

// A4: 595 x 842 pt. Margins: 48pt left/right, 56pt top, 64pt bottom.
const MARGIN_H = 48;
const MARGIN_TOP = 56;
const MARGIN_BOTTOM = 64;
const ACCENT = "#3550E0";
const DARK = "#14161A";
const MUTED = "#898E96";
const DIM = "#54585F";
const BORDER = "#ECECE7";
const SOFT_BG = "#F8F8F6";

// ─── Cover Page ────────────────────────────────────────────────────────────

function CoverPage({
  proposalNumber,
  headline,
  headlineAccent,
  subhead,
  clientName,
  projectName,
  investmentRange,
  preparedByName,
  preparedByInitials,
  issuedDate,
  validDays,
  orgName,
  brandLogoUrl,
}: {
  proposalNumber: string | null;
  headline: string;
  headlineAccent: string | null;
  subhead: string | null;
  clientName: string | null;
  projectName: string | null;
  investmentRange: string | null;
  preparedByName: string | null;
  preparedByInitials: string;
  issuedDate: string;
  validDays: number;
  orgName: string | null;
  brandLogoUrl: string | null;
}) {
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: "#FBFBF9",
        fontFamily: "Inter",
        padding: 0,
        position: "relative",
      }}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: MARGIN_H,
          paddingTop: MARGIN_TOP,
          paddingBottom: MARGIN_BOTTOM,
          flexDirection: "column",
        }}
      >
        {/* Top bar: brandmark + proposal number */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {brandLogoUrl ? (
              <Image src={brandLogoUrl} style={{ width: 28, height: 28, borderRadius: 4 }} />
            ) : (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  backgroundColor: DARK,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "Chillax",
                  }}
                >
                  {(orgName ?? "?")[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
            )}
            {orgName && (
              <Text
                style={{
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: 10,
                  color: DARK,
                  letterSpacing: -0.1,
                }}
              >
                {orgName}
              </Text>
            )}
          </View>
          {proposalNumber && (
            <Text
              style={{
                fontFamily: "Courier",
                fontSize: 8.5,
                color: DIM,
                letterSpacing: 0.3,
              }}
            >
              {proposalNumber}
            </Text>
          )}
        </View>

        {/* Body: eyebrow + headline + subhead + meta — vertically centered */}
        <View style={{ flex: 1, justifyContent: "center", maxWidth: 440 }}>
          {clientName && (
            <Text
              style={{
                fontSize: 7.5,
                fontWeight: 600,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: ACCENT,
                marginBottom: 18,
              }}
            >
              Proposal · Prepared for {clientName}
            </Text>
          )}

          {/* Headline — accent word in blue */}
          {headlineAccent && headline.includes(headlineAccent) ? (
            <Text
              style={{
                fontFamily: "Chillax",
                fontWeight: 600,
                fontSize: 46,
                lineHeight: 1.05,
                letterSpacing: -1.2,
                color: DARK,
                marginBottom: subhead ? 13 : 0,
              }}
            >
              {headline.split(headlineAccent)[0]}
              <Text style={{ color: ACCENT }}>{headlineAccent}</Text>
              {headline.split(headlineAccent)[1]}
            </Text>
          ) : (
            <Text
              style={{
                fontFamily: "Chillax",
                fontWeight: 600,
                fontSize: 46,
                lineHeight: 1.05,
                letterSpacing: -1.2,
                color: DARK,
                marginBottom: subhead ? 13 : 0,
              }}
            >
              {headline}
            </Text>
          )}

          {subhead && (
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 15,
                color: DIM,
                letterSpacing: -0.3,
                lineHeight: 1.4,
                marginBottom: 0,
                maxWidth: 380,
              }}
            >
              {subhead}
            </Text>
          )}

          {/* Meta grid: client, project, investment */}
          {(clientName || projectName || investmentRange) && (
            <View
              style={{
                flexDirection: "row",
                gap: 28,
                marginTop: 46,
              }}
            >
              {clientName && (
                <View>
                  <Text
                    style={{
                      fontSize: 7,
                      letterSpacing: 0.9,
                      textTransform: "uppercase",
                      color: MUTED,
                      marginBottom: 3,
                    }}
                  >
                    Client
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: 500, color: DARK }}>
                    {clientName}
                  </Text>
                </View>
              )}
              {projectName && (
                <View>
                  <Text
                    style={{
                      fontSize: 7,
                      letterSpacing: 0.9,
                      textTransform: "uppercase",
                      color: MUTED,
                      marginBottom: 3,
                    }}
                  >
                    Project
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: 500, color: DARK }}>
                    {projectName}
                  </Text>
                </View>
              )}
              {investmentRange && (
                <View>
                  <Text
                    style={{
                      fontSize: 7,
                      letterSpacing: 0.9,
                      textTransform: "uppercase",
                      color: MUTED,
                      marginBottom: 3,
                    }}
                  >
                    Investment
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: 500, color: DARK }}>
                    {investmentRange}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Bottom: prepared by + date */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: ACCENT,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: "Inter",
                }}
              >
                {preparedByInitials}
              </Text>
            </View>
            {preparedByName && (
              <Text
                style={{ fontSize: 10, fontWeight: 500, color: DARK, fontFamily: "Inter" }}
              >
                {preparedByName}
              </Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, color: MUTED, fontFamily: "Courier" }}>
              Issued {issuedDate}
            </Text>
            <Text style={{ fontSize: 8, color: MUTED, fontFamily: "Courier", marginTop: 2 }}>
              Valid {validDays} days
            </Text>
          </View>
        </View>
      </View>
    </Page>
  );
}


// ─── Content Page ───────────────────────────────────────────────────────────

const _pdfStyles = makePdfStyles(ACCENT, "Inter");

function ContentPage({
  proposalNumber,
  clientName,
  projectName,
  contentJson,
}: {
  proposalNumber: string | null;
  clientName: string | null;
  projectName: string | null;
  contentJson: TiptapDoc | null;
}) {
  return (
    <Page
      size="A4"
      style={{
        fontFamily: "Inter",
        fontSize: 10,
        color: DARK,
        backgroundColor: SOFT_BG,
        paddingHorizontal: MARGIN_H,
        paddingTop: MARGIN_TOP,
        paddingBottom: MARGIN_BOTTOM,
      }}
    >
      {/* Page header band */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingBottom: 12,
          marginBottom: 22,
          borderBottomWidth: 1,
          borderBottomColor: BORDER,
        }}
        fixed
      >
        <Text
          style={{
            fontSize: 7.5,
            color: MUTED,
            letterSpacing: 0.7,
            textTransform: "uppercase",
            fontFamily: "Courier",
          }}
        >
          {proposalNumber ? `Proposal ${proposalNumber}` : "Proposal"}
          {clientName ? ` · ${clientName}` : ""}
          {projectName ? ` — ${projectName}` : ""}
        </Text>
        <Text
          style={{
            fontSize: 7.5,
            color: MUTED,
            letterSpacing: 0.7,
            textTransform: "uppercase",
            fontFamily: "Courier",
          }}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </View>

      {/* Rich text body */}
      {renderTiptapContent(contentJson?.content, { styles: _pdfStyles, primaryColor: ACCENT })}
    </Page>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export type ProposalPdfProps = {
  document: { id: string; title: string; created_at: string; content_json: TiptapDoc };
  variableContext: VariableContext;
  brandLogoUrl: string | null;
  businessName: string | null;
  proposalData: {
    proposal_number: string | null;
    notes_footer: string | null;
    proposal_content?: { headline?: string | null; headline_accent?: string | null; subhead?: string | null; investment_range?: string | null } | null;
  };
};

export function ProposalPdf({
  document,
  variableContext,
  brandLogoUrl,
  businessName,
  proposalData,
}: ProposalPdfProps) {
  const coverContent = proposalData.proposal_content ?? {};

  const orgName = businessName ?? variableContext.brand?.business_name ?? null;
  const clientName =
    variableContext.client?.company ?? variableContext.client?.name ?? null;
  const projectName = variableContext.project?.title ?? null;
  const preparedByName = variableContext.sender?.name ?? orgName ?? null;
  const initials = preparedByName
    ? preparedByName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const headline = coverContent.headline ?? document.title ?? "Proposal";
  const issuedDate = new Date(document.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Document title={document.title} author={businessName ?? undefined} creator="Manpower">
      <CoverPage
        proposalNumber={proposalData.proposal_number}
        headline={headline}
        headlineAccent={coverContent.headline_accent ?? null}
        subhead={coverContent.subhead ?? null}
        clientName={clientName}
        projectName={projectName}
        investmentRange={coverContent.investment_range ?? null}
        preparedByName={preparedByName}
        preparedByInitials={initials}
        issuedDate={issuedDate}
        validDays={30}
        orgName={orgName}
        brandLogoUrl={brandLogoUrl}
      />
      <ContentPage
        proposalNumber={proposalData.proposal_number}
        clientName={clientName}
        projectName={projectName}
        contentJson={document.content_json}
      />
    </Document>
  );
}
