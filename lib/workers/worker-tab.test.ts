import { describe, expect, it } from "vitest";
import { parseWorkerTab } from "./worker-tab";

describe("parseWorkerTab", () => {
  it.each<[string | string[] | null | undefined, string]>([
    ["details", "details"],
    ["documents", "documents"],
    ["accommodation", "accommodation"],
    ["timesheets", "timesheets"],
    [["documents", "details"], "documents"],
    ["bogus", "details"],
    [undefined, "details"],
    [null, "details"],
  ])("%s → %s", (input, expected) => {
    expect(parseWorkerTab(input)).toBe(expected);
  });
});
