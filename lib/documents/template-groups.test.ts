import { describe, expect, it } from "vitest";
import type { DocumentTemplateRow } from "@/types";
import { groupTemplates } from "./template-groups";

const t = (over: Partial<DocumentTemplateRow>): DocumentTemplateRow => ({
  id: "t", user_id: null, type: "proposal", name: "Template", description: null,
  content_json: { type: "doc", content: [] } as DocumentTemplateRow["content_json"], is_system: true, created_at: "", updated_at: "", ...over,
});

describe("groupTemplates", () => {
  it("puts your own templates first, in any type", () => {
    const g = groupTemplates([t({ id: "a", is_system: false, user_id: "u", type: "invoice", name: "My invoice" }), t({ id: "b", name: "Simple Proposal" })]);
    expect(g.mine.map((x) => x.id)).toEqual(["a"]);
    expect(g.starters.map((x) => x.id)).toEqual(["b"]);
  });
  it("offers starters only for text-based types", () => {
    const g = groupTemplates([
      t({ id: "p", type: "proposal" }),
      t({ id: "o", type: "other", name: "Letter" }),
      t({ id: "i", type: "invoice", name: "Standard Invoice" }),
      t({ id: "q", type: "quote", name: "Basic Quote" }),
      t({ id: "l", type: "local_purchase_order", name: "Local Purchase Order" }),
    ]);
    expect(g.starters.map((x) => x.id)).toEqual(["p", "o"]);
  });
  it("hides the blank starter, which a new draft already is", () => {
    expect(groupTemplates([t({ name: "Blank document", type: "other" })]).starters).toEqual([]);
  });
  it("filters both groups by type", () => {
    const g = groupTemplates([t({ id: "m1", is_system: false, user_id: "u", type: "quote" }), t({ id: "m2", is_system: false, user_id: "u", type: "proposal" })], "quote");
    expect(g.mine.map((x) => x.id)).toEqual(["m1"]);
  });
});
