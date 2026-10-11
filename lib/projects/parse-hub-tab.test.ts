import { describe, expect, it } from "vitest";

import { parseHubTab } from "./display";

describe("parseHubTab", () => {
  it("keeps known tabs and defaults to tasks", () => {
    expect(parseHubTab("expenses")).toBe("expenses");
    expect(parseHubTab("timeline")).toBe("timeline");
    expect(parseHubTab("nope")).toBe("tasks");
    expect(parseHubTab(undefined)).toBe("tasks");
  });
});
