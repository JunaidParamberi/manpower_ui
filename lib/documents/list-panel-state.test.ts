import { describe, expect, it } from "vitest";

import {
  DOCUMENTS_LIST_COOKIE,
  isListToggleShortcut,
  parseListCollapsedCookie,
  serializeListCollapsedCookie,
} from "./list-panel-state";

describe("parseListCollapsedCookie", () => {
  it("is collapsed only for the stored 'collapsed' value", () => {
    expect(parseListCollapsedCookie("collapsed")).toBe(true);
    expect(parseListCollapsedCookie("expanded")).toBe(false);
    expect(parseListCollapsedCookie(undefined)).toBe(false);
    expect(parseListCollapsedCookie("garbage")).toBe(false);
  });
});

describe("serializeListCollapsedCookie", () => {
  it("writes a path-wide, year-long cookie", () => {
    expect(serializeListCollapsedCookie(true)).toBe(
      `${DOCUMENTS_LIST_COOKIE}=collapsed; path=/; max-age=31536000; samesite=lax`,
    );
    expect(serializeListCollapsedCookie(false)).toContain("=expanded;");
  });
});

describe("isListToggleShortcut", () => {
  const key = (k: string, extra: Partial<{ metaKey: boolean; ctrlKey: boolean; altKey: boolean }> = {}) => ({
    key: k,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    ...extra,
  });
  const body = { tagName: "BODY", isContentEditable: false };

  it("fires on a bare [", () => {
    expect(isListToggleShortcut(key("["), body)).toBe(true);
  });

  it("ignores modified keys (⌘[ is browser Back)", () => {
    expect(isListToggleShortcut(key("[", { metaKey: true }), body)).toBe(false);
    expect(isListToggleShortcut(key("[", { ctrlKey: true }), body)).toBe(false);
    expect(isListToggleShortcut(key("[", { altKey: true }), body)).toBe(false);
  });

  it("ignores typing in fields and editors", () => {
    for (const tagName of ["INPUT", "TEXTAREA", "SELECT"]) {
      expect(isListToggleShortcut(key("["), { tagName, isContentEditable: false })).toBe(false);
    }
    expect(isListToggleShortcut(key("["), { tagName: "DIV", isContentEditable: true })).toBe(false);
  });

  it("ignores other keys", () => {
    expect(isListToggleShortcut(key("]"), body)).toBe(false);
  });
});
