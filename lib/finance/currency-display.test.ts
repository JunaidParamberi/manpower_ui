import { describe, expect, it } from "vitest";

import {
  formatSecondaryCurrencies,
  secondaryCurrencyAmounts,
} from "@/lib/finance/currency-display";
import type { CurrencyBreakdown } from "@/lib/finance/summary-calc";

function bucket(partial: Partial<CurrencyBreakdown> & { currency: string }): CurrencyBreakdown {
  return {
    totalRevenue: 0,
    outstanding: 0,
    overdue: 0,
    outstandingCount: 0,
    overdueCount: 0,
    ...partial,
  };
}

describe("secondaryCurrencyAmounts", () => {
  it("lists every currency except the headline one, largest first", () => {
    const result = secondaryCurrencyAmounts(
      [
        bucket({ currency: "AED", totalRevenue: 6240 }),
        bucket({ currency: "USD", totalRevenue: 800 }),
        bucket({ currency: "GBP", totalRevenue: 2000 }),
      ],
      "AED",
      "totalRevenue",
    );
    expect(result).toEqual([
      { currency: "GBP", amount: 2000 },
      { currency: "USD", amount: 800 },
    ]);
  });

  it("skips currencies with nothing in the requested field", () => {
    const result = secondaryCurrencyAmounts(
      [
        bucket({ currency: "AED", overdue: 100 }),
        bucket({ currency: "USD", totalRevenue: 800 }),
      ],
      "AED",
      "overdue",
    );
    expect(result).toEqual([]);
  });
});

describe("formatSecondaryCurrencies", () => {
  it("renders a compact additive summary", () => {
    expect(
      formatSecondaryCurrencies(
        [
          bucket({ currency: "AED", totalRevenue: 6240 }),
          bucket({ currency: "USD", totalRevenue: 800 }),
        ],
        "AED",
        "totalRevenue",
      ),
    ).toBe("+ $800");
  });

  it("returns null when there is only one currency", () => {
    expect(
      formatSecondaryCurrencies(
        [bucket({ currency: "AED", totalRevenue: 6240 })],
        "AED",
        "totalRevenue",
      ),
    ).toBeNull();
  });
});
