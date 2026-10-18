import { describe, expect, it } from "vitest";
import { parseWorkerTab } from "./worker-tab";

describe("parseWorkerTab", () => {
  it.each<[string | string[] | null | undefined, string]>([
    ["overview", "overview"],
    ["documents", "documents"],
    ["clients", "clients"],
    ["accommodation", "accommodation"],
    ["timesheets", "timesheets"],
    ["about", "about"],
    ["details", "about"],
    [["documents", "about"], "documents"],
    ["bogus", "overview"],
    [undefined, "overview"],
    [null, "overview"],
  ])("%s → %s", (input, expected) => {
    expect(parseWorkerTab(input)).toBe(expected);
  });
});
