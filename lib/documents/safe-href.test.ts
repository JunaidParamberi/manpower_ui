import { describe, expect, it } from "vitest";

import { safeHref } from "./safe-href";

describe("safeHref", () => {
  it("keeps web, mail and phone links", () => {
    expect(safeHref("https://acme.com/brief")).toBe("https://acme.com/brief");
    expect(safeHref("http://acme.com")).toBe("http://acme.com");
    expect(safeHref("mailto:sara@acme.com")).toBe("mailto:sara@acme.com");
    expect(safeHref("tel:+97150123")).toBe("tel:+97150123");
  });

  it("drops script and data URLs, including obfuscated ones", () => {
    for (const bad of ["javascript:alert(1)", " JaVaScRiPt:alert(1)", "java\tscript:alert(1)", "data:text/html,<script>", "vbscript:x"]) {
      expect(safeHref(bad)).toBe("#");
    }
  });

  it("drops relative and empty links", () => {
    expect(safeHref("/admin")).toBe("#");
    expect(safeHref("")).toBe("#");
    expect(safeHref(undefined)).toBe("#");
  });
});
