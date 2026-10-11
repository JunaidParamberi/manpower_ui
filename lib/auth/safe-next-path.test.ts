import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("keeps relative paths with their query intact", () => {
    const next = "/mcp/authorize?client_id=abc&redirect_uri=https%3A%2F%2Fclaude.ai%2Fcb&state=s%26t";
    expect(safeNextPath(next)).toBe(next);
    expect(safeNextPath("/projects")).toBe("/projects");
  });
  it("falls back for open-redirect shapes", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "evil", "", null, undefined]) {
      expect(safeNextPath(bad)).toBe("/dashboard");
    }
  });
  it("rejects paths browsers normalize to another origin", () => {
    for (const bad of ["/\t/evil.com", "/\n/evil.com", "/\r/evil.com", "/\\evil.com", "/x\\..\\/evil.com", "/%09/evil.com".replace("%09", "\t")]) {
      expect(safeNextPath(bad)).toBe("/dashboard");
    }
  });
  it("uses a custom fallback", () => {
    expect(safeNextPath(null, "/onboarding")).toBe("/onboarding");
  });
});
