import { describe, expect, it } from "vitest";

import {
  cookiePrefsToMetadata,
  hasCookieConsent,
  needsAnonymousSync,
  parseStoredConsent,
  toProfileCookieUpdate,
} from "./cookie-prefs";

describe("toProfileCookieUpdate", () => {
  it("maps prefs to profile columns", () => {
    const now = new Date("2026-07-01T12:00:00.000Z");
    expect(
      toProfileCookieUpdate({ analytics: true, marketing: false }, now),
    ).toEqual({
      cookie_analytics: true,
      cookie_marketing: false,
      cookie_updated_at: "2026-07-01T12:00:00.000Z",
    });
  });
});

describe("parseStoredConsent", () => {
  it("parses valid JSON shape", () => {
    expect(
      parseStoredConsent({
        analytics: false,
        marketing: true,
        updatedAt: "2026-07-01T12:00:00.000Z",
      }),
    ).toEqual({
      analytics: false,
      marketing: true,
      updatedAt: "2026-07-01T12:00:00.000Z",
    });
  });

  it("returns null for invalid shape", () => {
    expect(parseStoredConsent({ analytics: "no" })).toBeNull();
    expect(parseStoredConsent(null)).toBeNull();
  });
});

describe("needsAnonymousSync", () => {
  it("syncs when profile has no cookie timestamp", () => {
    expect(
      needsAnonymousSync(
        {
          analytics: true,
          marketing: false,
          updatedAt: "2026-07-01T12:00:00.000Z",
        },
        {
          cookie_analytics: false,
          cookie_marketing: false,
          cookie_updated_at: null,
        },
      ),
    ).toBe(true);
  });

  it("syncs when local storage is newer", () => {
    expect(
      needsAnonymousSync(
        {
          analytics: true,
          marketing: false,
          updatedAt: "2026-07-02T12:00:00.000Z",
        },
        {
          cookie_analytics: false,
          cookie_marketing: false,
          cookie_updated_at: "2026-07-01T12:00:00.000Z",
        },
      ),
    ).toBe(true);
  });

  it("skips when profile is newer", () => {
    expect(
      needsAnonymousSync(
        {
          analytics: false,
          marketing: false,
          updatedAt: "2026-07-01T12:00:00.000Z",
        },
        {
          cookie_analytics: true,
          cookie_marketing: true,
          cookie_updated_at: "2026-07-02T12:00:00.000Z",
        },
      ),
    ).toBe(false);
  });
});

describe("hasCookieConsent", () => {
  it("is true when profile has timestamp", () => {
    expect(
      hasCookieConsent(
        {
          cookie_analytics: false,
          cookie_marketing: false,
          cookie_updated_at: "2026-07-01T12:00:00.000Z",
        },
        null,
      ),
    ).toBe(true);
  });

  it("is true when local storage exists", () => {
    expect(
      hasCookieConsent(null, {
        analytics: false,
        marketing: false,
        updatedAt: "2026-07-01T12:00:00.000Z",
      }),
    ).toBe(true);
  });

  it("is false with no profile or storage", () => {
    expect(hasCookieConsent(null, null)).toBe(false);
  });
});

describe("cookiePrefsToMetadata", () => {
  it("returns analytics and marketing flags", () => {
    expect(
      cookiePrefsToMetadata({ analytics: true, marketing: false }),
    ).toEqual({ analytics: true, marketing: false });
  });
});
