import { describe, expect, it } from "vitest";

import {
  formatCurrencySelectLabel,
  isSupportedCurrencyCode,
  SUPPORTED_CURRENCIES,
} from "@/lib/data/currencies";

describe("currency data helpers", () => {
  it("contains the existing profile currency options", () => {
    expect(SUPPORTED_CURRENCIES.map((currency) => currency.code)).toEqual([
      "USD",
      "EUR",
      "GBP",
      "AED",
      "SAR",
      "QAR",
      "KWD",
      "BHD",
      "OMR",
      "EGP",
      "CAD",
      "AUD",
      "INR",
    ]);
  });

  it("formats stable labels for select triggers", () => {
    expect(formatCurrencySelectLabel("AED")).toBe("AED - UAE dirham");
    expect(formatCurrencySelectLabel("usd")).toBe("USD - US dollar");
    expect(formatCurrencySelectLabel("ZZZ")).toBe("ZZZ");
  });

  it("checks supported currency codes case-insensitively", () => {
    expect(isSupportedCurrencyCode("aed")).toBe(true);
    expect(isSupportedCurrencyCode("ZZZ")).toBe(false);
  });
});
