import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ProfileRow } from "@/types";

import { ProfileSettingsForm as ProfileForm } from "./profile-form";

const profile: ProfileRow = {
  id: "u1",
  full_name: "John Doe",
  company_name: "Manpower Studio",
  vat_registered: true,
  vat_number: "100123456700003",
  gstin: null,
  vat_reg_no: null,
  upi_id: null,
  default_tds_rate: 0,
  address_line1: "123 Sheikh Zayed Rd",
  address_line2: null,
  address_city: "Dubai",
  address_region: null,
  address_postal_code: null,
  address_country: "AE",
  default_currency: "AED",
  default_tax_mode: "none",
  default_tax_rate: 0,
  brand_kit_id: null,
  plan_tier: "starter",
  onboarding_brand_skipped: false,
  onboarding_completed_at: "2026-01-15T10:00:00Z",
  terms_accepted_at: "2026-07-01T10:00:00.000Z",
  terms_version: "2026-07-01",
  privacy_accepted_at: "2026-07-01T10:00:00.000Z",
  privacy_version: "2026-07-01",
  cookie_analytics: true,
  cookie_marketing: false,
  cookie_updated_at: "2026-07-01T11:00:00.000Z",
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-05-20T14:30:00Z",
};

const meta: Meta<typeof ProfileForm> = {
  title: "Features/Settings/ProfileForm",
  component: ProfileForm,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProfileForm>;

export const Default: Story = { args: { profile } };

export const EmptyProfile: Story = {
  args: {
    profile: {
      ...profile,
      full_name: null,
      company_name: null,
      vat_registered: false,
      vat_number: null,
      address_line1: null,
      address_city: null,
      address_country: null,
    },
  },
};
