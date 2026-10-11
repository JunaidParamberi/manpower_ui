import { describe, expect, it } from "vitest";
import { TOKEN_COLORS, tokenColor } from "./token-color";

describe("tokenColor", () => {
  it("is stable for the same id", () => expect(tokenColor("abc")).toBe(tokenColor("abc")));
  it("always returns a palette colour", () => {
    for (const id of ["", "a", "client-123", "e3b0c442-98fc-1c14-9afb-f4c8996fb924"]) {
      expect(TOKEN_COLORS).toContain(tokenColor(id));
    }
  });
});
