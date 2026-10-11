import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { legalConfig } from "@/config/legal";
import { TERMS_SECTIONS } from "@/content/legal/terms";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Manpower Terms of Service",
};

export default function TermsPage() {
  return (
    <LegalDocumentPage
      title="Terms of Service"
      effectiveDate="1 July 2026"
      sections={TERMS_SECTIONS}
      sibling={{ href: legalConfig.privacyPath, label: "Privacy Policy" }}
    />
  );
}
