import { describe, expect, it } from "vitest";
import type { TiptapNode } from "@/types";
import { templatePreview, variableLabel } from "./template-preview";

const doc = (text: string) => ({ content: [{ type: "paragraph", content: [{ type: "text", text }] }] as TiptapNode[] });

describe("variableLabel", () => {
  it("humanises snake case", () => {
    expect(variableLabel("client_name")).toBe("Client name");
    expect(variableLabel("brand_business_name")).toBe("Business name");
    expect(variableLabel("today")).toBe("Today");
    expect(variableLabel("project_title")).toBe("Project title");
  });
});

describe("templatePreview", () => {
  it("splits text and variables", () => {
    expect(templatePreview(doc("Quote for {{client_name}} on {{today}}."))).toEqual([
      { kind: "text", text: "Quote for " },
      { kind: "var", name: "client_name", label: "Client name" },
      { kind: "text", text: " on " },
      { kind: "var", name: "today", label: "Today" },
      { kind: "text", text: "." },
    ]);
  });
  it("tolerates spaces inside braces", () => {
    expect(templatePreview(doc("Hi {{ client_contact_name }}"))[1]).toEqual({ kind: "var", name: "client_contact_name", label: "Contact name" });
  });
  it("returns nothing for empty content", () => {
    expect(templatePreview(null)).toEqual([]);
  });
  it("truncates long text with an ellipsis, never splitting a variable", () => {
    const segs = templatePreview(doc("a".repeat(200) + " {{client_name}}"), 50);
    expect(segs).toEqual([{ kind: "text", text: "a".repeat(50) + "…" }]);
  });
});
