import { describe, expect, it } from "vitest";
import {
  API_KEY_EXPIRY_PRESETS,
  expiryValueFor,
  type ApiKeyExpiryPreset,
} from "./expiry-presets";

/** Fixed local-time anchor so date math is deterministic across TZ machines. */
const NOW = new Date(2026, 8, 15); // 2026-09-15 local

function presetFor(label: string): ApiKeyExpiryPreset {
  const found = API_KEY_EXPIRY_PRESETS.find((p) => p.label === label);
  if (!found) throw new Error(`preset not found: ${label}`);
  return found;
}

describe("API_KEY_EXPIRY_PRESETS", () => {
  it("keeps the four labels the dialog renders", () => {
    expect(API_KEY_EXPIRY_PRESETS.map((p) => p.label)).toEqual([
      "30 days",
      "90 days",
      "1 year",
      "Never",
    ]);
  });

  it("marks Never as a null-offset (never expires)", () => {
    expect(presetFor("Never").calculateDays).toBeNull();
  });
});

describe("expiryValueFor", () => {
  it("resolves 30 days out to the same local calendar day", () => {
    expect(expiryValueFor(presetFor("30 days"), "", NOW)).toBe("2026-10-15");
  });

  it("resolves 90 days and 1 year deterministically", () => {
    expect(expiryValueFor(presetFor("90 days"), "", NOW)).toBe("2026-12-14");
    expect(expiryValueFor(presetFor("1 year"), "", NOW)).toBe("2027-09-15");
  });

  it("maps Never (and any null calculateDays) to empty string", () => {
    expect(expiryValueFor(presetFor("Never"), "", NOW)).toBe("");
  });

  it("is stable across the UTC/ISO boundary (local-time math, not toISOString)", () => {
    // 2026-10-15T00:00 in UTC-7 is 2026-10-16 in UTC; a toISOString-based
    // resolver would flip the day, but the local-accessor resolver must not.
    const edge = new Date(2026, 9, 15, 23, 59, 59); // one minute before local midnight
    expect(expiryValueFor(presetFor("30 days"), "", edge)).toBe("2026-11-14");
  });
});
