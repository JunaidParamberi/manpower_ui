import { describe, expect, it } from "vitest";
import { approvalLink } from "./approval-link";

describe("approvalLink", () => {
  it("joins origin and token", () => {
    expect(approvalLink("abc123", "https://app.manpower.com")).toBe("https://app.manpower.com/quote/abc123");
  });
  it("ignores a trailing slash on the origin", () => {
    expect(approvalLink("abc123", "https://app.manpower.com/")).toBe("https://app.manpower.com/quote/abc123");
  });
  it("falls back to a relative path when the origin is empty", () => {
    expect(approvalLink("abc123", "")).toBe("/quote/abc123");
  });
  it("sends proposals to their own page", () => {
    expect(approvalLink("abc123", "https://app.manpower.com", "proposal")).toBe("https://app.manpower.com/proposal/abc123");
  });
});
