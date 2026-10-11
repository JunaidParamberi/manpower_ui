import { describe, expect, it } from "vitest";

import { parseClientTab } from "./client-tab";

describe("parseClientTab", () => {
  it.each<[string | string[] | null | undefined, string]>([
    ["overview", "overview"],
    ["projects", "projects"],
    ["documents", "documents"],
    ["activity", "activity"],
    ["about", "about"],
    [["documents", "about"], "documents"],
    ["notes", "overview"],
    [undefined, "overview"],
    [null, "overview"],
  ])("%s → %s", (input, expected) => {
    expect(parseClientTab(input)).toBe(expected);
  });
});
