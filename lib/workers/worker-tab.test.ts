import { describe, expect, it } from "vitest";
import { parseWorkerTab, workerHref } from "./worker-tab";

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

describe("workerHref", () => {
  it("links to the detail without params by default", () => {
    expect(workerHref("w1")).toBe("/workers/w1");
  });

  it("sets ?tab and omits it for overview", () => {
    expect(workerHref("w1", { tab: "documents" })).toBe("/workers/w1?tab=documents");
    expect(workerHref("w1", { tab: "overview" })).toBe("/workers/w1");
  });

  it("keeps q and lens, skipping empty q and lens=all", () => {
    expect(workerHref("w1", { q: "  ib ", lens: "needs-you", tab: "clients" })).toBe(
      "/workers/w1?q=ib&lens=needs-you&tab=clients",
    );
    expect(workerHref("w1", { q: "", lens: "all" })).toBe("/workers/w1");
    expect(workerHref("w1", { q: null, lens: null })).toBe("/workers/w1");
  });

  it("links to the edit page with the same filters", () => {
    expect(workerHref("w1", { edit: true, q: "ib", lens: "ready" })).toBe(
      "/workers/w1/edit?q=ib&lens=ready",
    );
  });
});
