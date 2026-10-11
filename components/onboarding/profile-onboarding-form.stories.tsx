import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ProfileRow } from "@/types";

import { ProfileOnboardingForm } from "./profile-onboarding-form";

const profile: ProfileRow = {
  id: "storybook-user",
  full_name: "Amina Rahman",
  company_name: "Northstar Creative",
  vat_registered: true,
  vat_number: "100234567800003",
  gstin: null,
  vat_reg_no: null,
  upi_id: null,
  default_tds_rate: 0,
  address_line1: "Marina Gate",
  address_line2: "Level 12",
  address_city: "Dubai",
  address_region: "Dubai",
  address_postal_code: "00000",
  address_country: "AE",
  default_currency: "AED",
  default_tax_mode: "none",
  default_tax_rate: 0,
  brand_kit_id: "storybook-brand-kit",
  plan_tier: "starter",
  onboarding_brand_skipped: false,
  onboarding_completed_at: null,
  terms_accepted_at: null,
  terms_version: null,
  privacy_accepted_at: null,
  privacy_version: null,
  cookie_analytics: false,
  cookie_marketing: false,
  cookie_updated_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-05-25T00:00:00.000Z",
};

const meta: Meta<typeof ProfileOnboardingForm> = {
  title: "Onboarding/ProfileOnboardingForm",
  component: ProfileOnboardingForm,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[680px] max-w-[calc(100vw-2rem)] rounded-[2rem] border bg-background p-8 shadow-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProfileOnboardingForm>;

export const Empty: Story = {
  args: { initialProfile: null },
};

export const Prefilled: Story = {
  args: { initialProfile: profile },
};

export const NotVatRegistered: Story = {
  args: {
    initialProfile: {
      ...profile,
      vat_registered: false,
      vat_number: null,
    },
  },
};

export const IndiaGstin: Story = {
  args: {
    initialProfile: {
      ...profile,
      vat_registered: false,
      vat_number: null,
      address_country: "IN",
      address_city: "Bangalore",
      address_region: "Karnataka",
      default_currency: "INR",
      gstin: "29ABCDE1234F1Z5",
      vat_reg_no: null,
    },
  },
};

export const IndiaWithUpiId: Story = {
  name: "India — GSTIN + UPI ID",
  args: {
    initialProfile: {
      ...profile,
      vat_registered: false,
      vat_number: null,
      address_country: "IN",
      address_city: "Bangalore",
      address_region: "Karnataka",
      default_currency: "INR",
      gstin: "29ABCDE1234F1Z5",
      vat_reg_no: null,
      upi_id: "amina.rahman@oksbi",
    },
  },
};

export const IndiaCompliance: Story = {
  name: "India — compliance fields (accordion)",
  args: {
    initialProfile: {
      ...profile,
      vat_registered: false,
      vat_number: null,
      address_country: "IN",
      address_city: "Mumbai",
      address_region: "Maharashtra",
      default_currency: "INR",
      gstin: "27AABCU9603R1ZX",
      vat_reg_no: null,
      upi_id: "studio@okicici",
      default_tds_rate: 10,
    },
  },
};

export const UkVatReg: Story = {
  args: {
    initialProfile: {
      ...profile,
      address_country: "GB",
      address_city: "London",
      address_region: "England",
      default_currency: "GBP",
      gstin: null,
      vat_reg_no: "GB123456789",
    },
  },
};
