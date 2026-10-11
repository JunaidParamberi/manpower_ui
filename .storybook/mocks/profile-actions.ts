export async function updateProfile() {
  return {
    ok: true,
    profile: {
      id: "storybook-user",
      full_name: "Amina Rahman",
      company_name: "Northstar Creative",
      vat_registered: true,
      vat_number: "100234567800003",
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
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-05-25T00:00:00.000Z",
    },
  };
}

export async function updateTaxDefaults() {
  return { ok: true };
}

export async function getProfile() {
  return {
    ok: true,
    profile: {
      id: "storybook-user",
      full_name: "Amina Rahman",
      company_name: "Northstar Creative",
      vat_registered: true,
      vat_number: "100234567800003",
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
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-05-25T00:00:00.000Z",
    },
  };
}
