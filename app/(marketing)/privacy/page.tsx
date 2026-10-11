import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { legalConfig } from "@/config/legal";
import { PRIVACY_SECTIONS } from "@/content/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Manpower Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      effectiveDate="1 July 2026"
      sections={PRIVACY_SECTIONS}
      sibling={{ href: legalConfig.termsPath, label: "Terms of Service" }}
    />
  );
}
