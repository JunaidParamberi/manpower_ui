import type { Meta, StoryObj } from "@storybook/react";

import { ConsentLogSection } from "./consent-log-section";
import { CookieConsentBanner } from "./cookie-consent-banner";
import { CookiePreferencesSection } from "./cookie-preferences-section";
import { LegalAcceptanceModal } from "./legal-acceptance-modal";
import { PoliciesSection } from "./policies-section";
import type { PrivacyProfileFields } from "@/lib/legal/consent-queries";
import type { ConsentLogRow } from "@/types";

const sampleProfile: PrivacyProfileFields = {
  terms_accepted_at: "2026-07-01T10:00:00.000Z",
  terms_version: "2026-07-01",
  privacy_accepted_at: "2026-07-01T10:00:00.000Z",
  privacy_version: "2026-07-01",
  cookie_analytics: true,
  cookie_marketing: false,
  cookie_updated_at: "2026-07-01T11:00:00.000Z",
};

const sampleLog: ConsentLogRow[] = [
  {
    id: "log-1",
    user_id: "user-1",
    consent_type: "terms",
    action: "accepted",
    policy_version: "2026-07-01",
    metadata: null,
    created_at: "2026-07-01T10:00:00.000Z",
  },
  {
    id: "log-2",
    user_id: "user-1",
    consent_type: "cookies",
    action: "updated",
    policy_version: "2026-07-01",
    metadata: { analytics: true, marketing: false },
    created_at: "2026-07-01T11:00:00.000Z",
  },
];

const meta: Meta<typeof PoliciesSection> = {
  title: "Features/Settings/Legal",
  parameters: {
    docs: {
      description: {
        component:
          "Legal & privacy settings at /settings/legal: external policy links, cookie preferences, and consent audit log.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PoliciesSection>;

export const Policies: Story = {
  render: () => <PoliciesSection profile={sampleProfile} />,
};

export const CookiePreferences: Story = {
  render: () => <CookiePreferencesSection profile={sampleProfile} />,
};

export const ConsentLog: Story = {
  render: () => <ConsentLogSection entries={sampleLog} />,
};

export const ConsentLogEmpty: Story = {
  render: () => <ConsentLogSection entries={[]} />,
};

export const AcceptanceModal: Story = {
  render: () => (
    <LegalAcceptanceModal open onAccepted={() => undefined} />
  ),
};

export const CookieBanner: Story = {
  render: () => <CookieConsentBanner />,
};
