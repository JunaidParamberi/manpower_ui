import { describe, expect, it } from "vitest";

import {
  buildMarketingHref,
  monthOf,
  parseMarketingViewParams,
  snapToMonday,
  weekAnchorOf,
  type MarketingViewParams,
} from "./marketing-view-params";

// Monday 2026-06-15. Built from local parts so the test is timezone-agnostic.
const NOW = new Date(2026, 5, 15, 10, 30);

const BASE: MarketingViewParams = {
  view: "month",
  month: "2026-06",
  week: "2026-06-15",
  client: "all",
  platform: "all",
  status: "all",
  campaign: "all",
};

describe("monthOf / weekAnchorOf", () => {
  it("formats the local month", () => {
    expect(monthOf(new Date(2026, 0, 5))).toBe("2026-01");
    expect(monthOf(new Date(2026, 11, 31))).toBe("2026-12");
  });

  it("anchors to the Monday of the local week", () => {
    expect(weekAnchorOf(new Date(2026, 5, 15))).toBe("2026-06-15"); // Monday
    expect(weekAnchorOf(new Date(2026, 5, 21))).toBe("2026-06-15"); // Sunday
    expect(weekAnchorOf(new Date(2026, 5, 22))).toBe("2026-06-22"); // next Monday
  });

  it("snaps an arbitrary date back to its Monday", () => {
    expect(snapToMonday("2026-06-18")).toBe("2026-06-15");
    expect(snapToMonday("2026-06-15")).toBe("2026-06-15");
    // Crosses a month boundary backwards.
    expect(snapToMonday("2026-07-01")).toBe("2026-06-29");
  });
});

describe("parseMarketingViewParams", () => {
  it("falls back to defaults for an empty query", () => {
    expect(parseMarketingViewParams({}, NOW)).toEqual(BASE);
  });

  it("accepts every valid param", () => {
    const parsed = parseMarketingViewParams(
      {
        view: "week",
        month: "2026-03",
        week: "2026-03-02",
        client: "11111111-2222-3333-4444-555555555555",
        platform: "Instagram",
        status: "scheduled",
        campaign: "66666666-7777-8888-9999-aaaaaaaaaaaa",
      },
      NOW,
    );
    expect(parsed).toEqual({
      view: "week",
      month: "2026-03",
      week: "2026-03-02",
      client: "11111111-2222-3333-4444-555555555555",
      platform: "Instagram",
      status: "scheduled",
      campaign: "66666666-7777-8888-9999-aaaaaaaaaaaa",
    });
  });

  it("rejects malformed values without throwing", () => {
    const parsed = parseMarketingViewParams(
      {
        view: "kanban",
        month: "2026-13",
        week: "not-a-date",
        client: "nope",
        status: "archived",
        campaign: "nope",
      },
      NOW,
    );
    expect(parsed).toEqual(BASE);
  });

  it("snaps a non-Monday week param", () => {
    const parsed = parseMarketingViewParams({ week: "2026-06-18" }, NOW);
    expect(parsed.week).toBe("2026-06-15");
  });
});

describe("buildMarketingHref", () => {
  it("emits both period params for the default month view", () => {
    expect(buildMarketingHref({}, BASE)).toBe(
      "/marketing?month=2026-06&week=2026-06-15",
    );
  });

  it("still carries the month when the view is week", () => {
    const href = buildMarketingHref({ view: "week" }, BASE);
    expect(href).toBe("/marketing?view=week&month=2026-06&week=2026-06-15");
  });

  it("still carries the week for the agenda view", () => {
    expect(buildMarketingHref({ view: "agenda" }, BASE)).toBe(
      "/marketing?view=agenda&month=2026-06&week=2026-06-15",
    );
  });

  it("emits month and week in every href", () => {
    for (const view of ["month", "week", "agenda"] as const) {
      const query = new URLSearchParams(
        buildMarketingHref({ view }, BASE).split("?")[1],
      );
      expect(query.get("month")).toBe("2026-06");
      expect(query.get("week")).toBe("2026-06-15");
    }
  });

  it("drops filters that are at their default", () => {
    const href = buildMarketingHref({ status: "idea" }, BASE);
    expect(href).toBe("/marketing?month=2026-06&week=2026-06-15&status=idea");
    expect(href).not.toContain("client=");
    expect(href).not.toContain("platform=");
    expect(href).not.toContain("campaign=");
  });

  it("merges a patch over the base rather than replacing it", () => {
    const href = buildMarketingHref(
      { month: "2026-07" },
      { ...BASE, status: "drafted", platform: "LinkedIn" },
    );
    expect(href).toBe(
      "/marketing?month=2026-07&week=2026-06-15&platform=LinkedIn&status=drafted",
    );
  });

  it("round-trips through parse", () => {
    const href = buildMarketingHref({ view: "week", status: "posted" }, BASE);
    const query = Object.fromEntries(
      new URLSearchParams(href.split("?")[1]).entries(),
    );
    const parsed = parseMarketingViewParams(query, NOW);
    expect(parsed.view).toBe("week");
    expect(parsed.status).toBe("posted");
    expect(parsed.week).toBe("2026-06-15");
  });

  it("keeps the far-away month across a switch into week view", () => {
    // Previously the month was dropped from the href, so parsing the result
    // fell back to "now" (June) and December was lost.
    const december: MarketingViewParams = { ...BASE, month: "2026-12" };
    const href = buildMarketingHref({ view: "week" }, december);
    const parsed = parseMarketingViewParams(
      Object.fromEntries(new URLSearchParams(href.split("?")[1]).entries()),
      NOW,
    );
    expect(parsed.month).toBe("2026-12");
  });

  it("keeps the far-away week across a switch back to month view", () => {
    const ahead: MarketingViewParams = {
      ...BASE,
      view: "week",
      week: "2026-07-06",
    };
    const href = buildMarketingHref({ view: "month" }, ahead);
    const parsed = parseMarketingViewParams(
      Object.fromEntries(new URLSearchParams(href.split("?")[1]).entries()),
      NOW,
    );
    expect(parsed.week).toBe("2026-07-06");
  });
});
