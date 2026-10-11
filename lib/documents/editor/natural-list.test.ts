import { describe, expect, it } from "vitest";
import { naturalList } from "./natural-list";

describe("naturalList", () => {
  it("joins like a sentence", () => {
    expect(naturalList([])).toBe("");
    expect(naturalList(["client"])).toBe("client");
    expect(naturalList(["client", "AED"])).toBe("client and AED");
    expect(naturalList(["client", "project", "AED"])).toBe("client, project and AED");
  });
});
