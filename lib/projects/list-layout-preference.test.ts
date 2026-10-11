import { describe, expect, it } from "vitest";

import { parseProjectsListLayout, projectsListLayoutCookieValue } from "./list-layout-preference";

describe("projects view preference", () => {
  it("accepts the three views", () => {
    expect(parseProjectsListLayout("list")).toBe("list");
    expect(parseProjectsListLayout("board")).toBe("board");
    expect(parseProjectsListLayout("timeline")).toBe("timeline");
  });
  it("maps the retired hub/table values to list", () => {
    expect(parseProjectsListLayout("hub")).toBe("list");
    expect(parseProjectsListLayout("table")).toBe("list");
  });
  it("rejects anything else", () => {
    expect(parseProjectsListLayout("grid")).toBeNull();
    expect(parseProjectsListLayout(undefined)).toBeNull();
  });
  it("writes a year-long cookie", () => {
    expect(projectsListLayoutCookieValue("board")).toContain("=board; path=/; max-age=31536000");
  });
});
