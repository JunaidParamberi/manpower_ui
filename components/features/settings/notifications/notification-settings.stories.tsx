import type { Meta, StoryObj } from "@storybook/react";

import { EmailPreferencesSection } from "./email-preferences-section";
import { NOTIFICATION_EMAIL_DEFAULTS } from "@/lib/notifications/email-prefs";
import type { NotificationEmailPrefsProfile } from "@/lib/notifications/prefs-queries";

const defaultProfile: NotificationEmailPrefsProfile = {
  prefs: { ...NOTIFICATION_EMAIL_DEFAULTS },
  notification_email_updated_at: "2026-07-02T10:00:00.000Z",
};

const mixedProfile: NotificationEmailPrefsProfile = {
  prefs: {
    ...NOTIFICATION_EMAIL_DEFAULTS,
    invoice_paid: false,
    doc_sent: true,
  },
  notification_email_updated_at: null,
};

const meta: Meta<typeof EmailPreferencesSection> = {
  title: "Features/Settings/Notifications",
  component: EmailPreferencesSection,
  parameters: {
    docs: {
      description: {
        component:
          "Notification email preferences at /settings/notifications. Per-event toggles for freelancer backup emails; in-app bell notifications stay on.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof EmailPreferencesSection>;

export const Default: Story = {
  render: () => <EmailPreferencesSection profile={defaultProfile} />,
};

export const MixedToggles: Story = {
  render: () => <EmailPreferencesSection profile={mixedProfile} />,
};

export const NeverSaved: Story = {
  render: () => (
    <EmailPreferencesSection
      profile={{
        prefs: { ...NOTIFICATION_EMAIL_DEFAULTS },
        notification_email_updated_at: null,
      }}
    />
  ),
};
