import { describe, it, expect } from "vitest";
import { mergeAndValidateProfile, PROFILE_LIMITS } from "./profile";
import type { ProfileRow } from "@/types";

function baseRow(): ProfileRow {
  return {
    id: "user-1",
    full_name: "Jane Doe",
    company_name: "Acme Studio",
    vat_registered: false,
    vat_number: null,
    gstin: null,
    vat_reg_no: null,
    upi_id: null,
    default_tds_rate: 0,
    address_line1: null,
    address_line2: null,
    address_city: null,
    address_region: null,
    address_postal_code: null,
    address_country: "AE",
    default_currency: "AED",
    default_tax_mode: "none",
    default_tax_rate: 0,
    brand_kit_id: null,
    plan_tier: "free",
    onboarding_brand_skipped: false,
    onboarding_completed_at: null,
    terms_accepted_at: null,
    terms_version: null,
    privacy_accepted_at: null,
    privacy_version: null,
    cookie_analytics: false,
    cookie_marketing: false,
    cookie_updated_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("mergeAndValidateProfile — gstin", () => {
  it("saves gstin when provided", () => {
    const result = mergeAndValidateProfile(baseRow(), { gstin: "29ABCDE1234F1Z5" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.gstin).toBe("29ABCDE1234F1Z5");
  });

  it("trims gstin whitespace", () => {
    const result = mergeAndValidateProfile(baseRow(), { gstin: "  29ABCDE1234F1Z5  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.gstin).toBe("29ABCDE1234F1Z5");
  });

  it("converts empty string gstin to null", () => {
    const result = mergeAndValidateProfile(baseRow(), { gstin: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.gstin).toBeNull();
  });

  it("rejects gstin exceeding max length", () => {
    const result = mergeAndValidateProfile(baseRow(), { gstin: "A".repeat(PROFILE_LIMITS.gstin + 1) });
    expect(result.success).toBe(false);
  });

  it("does NOT clear gstin when vat_registered is false", () => {
    const row = { ...baseRow(), gstin: "29ABCDE1234F1Z5" };
    const result = mergeAndValidateProfile(row, { vat_registered: false });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.gstin).toBe("29ABCDE1234F1Z5");
  });
});

describe("mergeAndValidateProfile — vat_reg_no", () => {
  it("saves vat_reg_no when provided", () => {
    const result = mergeAndValidateProfile(baseRow(), { vat_reg_no: "GB123456789" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.vat_reg_no).toBe("GB123456789");
  });

  it("trims vat_reg_no whitespace", () => {
    const result = mergeAndValidateProfile(baseRow(), { vat_reg_no: "  GB123456789  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.vat_reg_no).toBe("GB123456789");
  });

  it("converts empty string vat_reg_no to null", () => {
    const result = mergeAndValidateProfile(baseRow(), { vat_reg_no: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.vat_reg_no).toBeNull();
  });

  it("rejects vat_reg_no exceeding max length", () => {
    const result = mergeAndValidateProfile(baseRow(), { vat_reg_no: "A".repeat(PROFILE_LIMITS.vatRegNo + 1) });
    expect(result.success).toBe(false);
  });

  it("does NOT clear vat_reg_no when vat_registered is false", () => {
    const row = { ...baseRow(), vat_reg_no: "GB123456789" };
    const result = mergeAndValidateProfile(row, { vat_registered: false });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.vat_reg_no).toBe("GB123456789");
  });
});

describe("mergeAndValidateProfile — vat_number still cleared when vat_registered false", () => {
  it("clears vat_number when toggling vat_registered off", () => {
    const row = { ...baseRow(), vat_registered: true, vat_number: "100234567800003" };
    const result = mergeAndValidateProfile(row, { vat_registered: false });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.vat_number).toBeNull();
  });
});

describe("mergeAndValidateProfile — upi_id", () => {
  it("saves valid UPI VPA", () => {
    const result = mergeAndValidateProfile(baseRow(), { upi_id: "jane@oksbi" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.upi_id).toBe("jane@oksbi");
  });

  it("trims whitespace", () => {
    const result = mergeAndValidateProfile(baseRow(), { upi_id: "  jane@oksbi  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.upi_id).toBe("jane@oksbi");
  });

  it("empty string → null", () => {
    const result = mergeAndValidateProfile(baseRow(), { upi_id: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.upi_id).toBeNull();
  });

  it("null → null", () => {
    const result = mergeAndValidateProfile({ ...baseRow(), upi_id: "a@b" }, { upi_id: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.upi_id).toBeNull();
  });

  it("omitted → keeps existing value", () => {
    const row = { ...baseRow(), upi_id: "existing@upi" };
    const result = mergeAndValidateProfile(row, { full_name: "Jane" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.upi_id).toBe("existing@upi");
  });

  it("rejects VPA without @ (invalid format)", () => {
    const result = mergeAndValidateProfile(baseRow(), { upi_id: "janeatoksbi" });
    expect(result.success).toBe(false);
  });

  it("rejects VPA exceeding max length", () => {
    const result = mergeAndValidateProfile(baseRow(), { upi_id: "a".repeat(101) + "@upi" });
    expect(result.success).toBe(false);
  });

  it("accepts VPA with dots and hyphens (valid UPI chars)", () => {
    const result = mergeAndValidateProfile(baseRow(), { upi_id: "jane.doe-1@hdfc" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.upi_id).toBe("jane.doe-1@hdfc");
  });
});

describe("mergeAndValidateProfile — default_tds_rate", () => {
  it('default_tds_rate as string "10" → coerced to 10', () => {
    const result = mergeAndValidateProfile(baseRow(), { default_tds_rate: "10" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.default_tds_rate).toBe(10);
  });

  it("default_tds_rate of 0 → accepted", () => {
    const result = mergeAndValidateProfile(baseRow(), { default_tds_rate: 0 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.default_tds_rate).toBe(0);
  });

  it("default_tds_rate of 30 → accepted", () => {
    const result = mergeAndValidateProfile(baseRow(), { default_tds_rate: 30 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.default_tds_rate).toBe(30);
  });

  it("default_tds_rate > 100 → error", () => {
    const result = mergeAndValidateProfile(baseRow(), { default_tds_rate: 101 });
    expect(result.success).toBe(false);
  });

  it("default_tds_rate < 0 → error", () => {
    const result = mergeAndValidateProfile(baseRow(), { default_tds_rate: -1 });
    expect(result.success).toBe(false);
  });

  it("omitted default_tds_rate → keeps existing row value", () => {
    const row = { ...baseRow(), default_tds_rate: 10 };
    const result = mergeAndValidateProfile(row, { full_name: "Jane" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.default_tds_rate).toBe(10);
  });
});
