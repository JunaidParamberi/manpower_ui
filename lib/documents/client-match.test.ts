import { describe, expect, it } from "vitest";

import { matchClientByName } from "@/lib/documents/client-match";

describe("matchClientByName", () => {
  it("matches an exact case-insensitive name", () => {
    const result = matchClientByName("acme corp", [
      { id: "c1", name: "Acme Corp" },
      { id: "c2", name: "Northwind" },
    ]);
    expect(result).toEqual({ status: "matched", clientId: "c1" });
  });

  it("matches ignoring surrounding whitespace", () => {
    const result = matchClientByName("  Acme Corp  ", [
      { id: "c1", name: "Acme Corp" },
    ]);
    expect(result).toEqual({ status: "matched", clientId: "c1" });
  });

  it("returns ambiguous when multiple candidates share a name", () => {
    const result = matchClientByName("Acme", [
      { id: "c1", name: "Acme" },
      { id: "c2", name: "acme" },
    ]);
    expect(result).toEqual({
      status: "ambiguous",
      candidateNames: ["Acme", "acme"],
    });
  });

  it("returns none when no candidate matches", () => {
    const result = matchClientByName("Globex", [
      { id: "c1", name: "Acme Corp" },
    ]);
    expect(result).toEqual({ status: "none" });
  });

  it("returns none for an empty candidate list", () => {
    const result = matchClientByName("Acme Corp", []);
    expect(result).toEqual({ status: "none" });
  });

  it("returns none for a blank raw name", () => {
    const result = matchClientByName("   ", [
      { id: "c1", name: "Acme Corp" },
    ]);
    expect(result).toEqual({ status: "none" });
  });
});
