import { describe, expect, it } from "vitest";

import {
  classifyProjectRisk,
  deduplicateAttentionItems,
} from "./attention-utils";
import type { AttentionItem } from "./types";

const now = new Date("2026-05-15T12:00:00.000Z");

describe("classifyProjectRisk", () => {
  it("returns overdue when deadline is in the past", () => {
    expect(
      classifyProjectRisk(new Date("2026-05-10T12:00:00.000Z"), now)
    ).toBe("overdue");
  });

  it("returns at_risk when deadline is 3 days away", () => {
    expect(
      classifyProjectRisk(new Date("2026-05-18T12:00:00.000Z"), now)
    ).toBe("at_risk");
  });

  it("returns watch when deadline is 10 days away", () => {
    expect(
      classifyProjectRisk(new Date("2026-05-25T12:00:00.000Z"), now)
    ).toBe("watch");
  });

  it("returns on_track when deadline is 20 days away", () => {
    expect(
      classifyProjectRisk(new Date("2026-06-04T12:00:00.000Z"), now)
    ).toBe("on_track");
  });

  it("returns on_track when no deadline", () => {
    expect(classifyProjectRisk(null, now)).toBe("on_track");
  });
});

describe("deduplicateAttentionItems", () => {
  it("removes quote_no_response when same quote is expiring_quote", () => {
    const items: AttentionItem[] = [
      {
        type: "expiring_quote",
        id: "q1",
        href: "/documents/q1",
        label: "expiring",
        urgencyDays: 2,
      },
      {
        type: "quote_no_response",
        id: "q1",
        href: "/documents/q1",
        label: "no response",
        urgencyDays: 10,
      },
    ];
    const result = deduplicateAttentionItems(items);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("expiring_quote");
  });

  it("keeps both when different items", () => {
    const items: AttentionItem[] = [
      {
        type: "expiring_quote",
        id: "q1",
        href: "/documents/q1",
        label: "expiring",
        urgencyDays: 2,
      },
      {
        type: "quote_no_response",
        id: "q2",
        href: "/documents/q2",
        label: "no response",
        urgencyDays: 10,
      },
    ];
    expect(deduplicateAttentionItems(items)).toHaveLength(2);
  });
});
