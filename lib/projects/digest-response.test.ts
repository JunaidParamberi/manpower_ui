import { describe, it, expect } from "vitest";

import { parseDigestResponse } from "./digest-response";

const IDS = ["p1", "p2"];

function payload(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    narrative: "Two projects need attention today.",
    actions: [
      { projectId: "p1", title: "Chase the Acme invoice", detail: "27 days overdue." },
    ],
    ...overrides,
  });
}

describe("parseDigestResponse", () => {
  it("parses a well-formed response", () => {
    const result = parseDigestResponse(payload(), IDS);
    expect(result.narrative).toBe("Two projects need attention today.");
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].projectId).toBe("p1");
  });

  it("drops actions referencing an unknown project id", () => {
    const raw = payload({
      actions: [
        { projectId: "ghost", title: "Invented", detail: "d" },
        { projectId: "p2", title: "Real", detail: "d" },
      ],
    });
    const result = parseDigestResponse(raw, IDS);
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].projectId).toBe("p2");
  });

  it("caps actions at three", () => {
    const raw = payload({
      actions: Array.from({ length: 6 }, () => ({
        projectId: "p1",
        title: "t",
        detail: "d",
      })),
    });
    expect(parseDigestResponse(raw, IDS).actions).toHaveLength(3);
  });

  it("tolerates a fenced code block around the JSON", () => {
    const raw = "```json\n" + payload() + "\n```";
    expect(parseDigestResponse(raw, IDS).narrative).not.toBeNull();
  });

  it("returns a null narrative and no actions on unparseable input", () => {
    expect(parseDigestResponse("not json at all", IDS)).toEqual({
      narrative: null,
      actions: [],
    });
  });

  it("returns a null narrative when the narrative field is not a string", () => {
    const result = parseDigestResponse(payload({ narrative: 42 }), IDS);
    expect(result.narrative).toBeNull();
  });

  it("drops actions with missing or blank fields", () => {
    const raw = payload({
      actions: [
        { projectId: "p1", title: "", detail: "d" },
        { projectId: "p1", detail: "d" },
        { projectId: "p1", title: "Good", detail: "d" },
      ],
    });
    expect(parseDigestResponse(raw, IDS).actions).toHaveLength(1);
  });
});
