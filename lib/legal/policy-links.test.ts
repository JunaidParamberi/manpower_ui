import { describe, expect, it } from "vitest";

import { LEGAL_LINK_REL, LEGAL_LINK_TARGET, policyAbsoluteUrl } from "./policy-links";

describe("policyAbsoluteUrl", () => {
  it("returns path when app url is unset", () => {
    expect(policyAbsoluteUrl("/terms")).toBe("/terms");
  });
});

describe("legal link constants", () => {
  it("opens in a new tab safely", () => {
    expect(LEGAL_LINK_TARGET).toBe("_blank");
    expect(LEGAL_LINK_REL).toBe("noopener noreferrer");
  });
});
