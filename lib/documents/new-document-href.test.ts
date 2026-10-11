import { describe, expect, it } from "vitest";
import { editorHrefForNew, parseNewDocumentParams } from "./new-document-href";

const uuid = "3f2b8c1e-1a2b-4c3d-8e9f-0a1b2c3d4e5f";

describe("parseNewDocumentParams", () => {
  it("reads type, client and project", () => {
    expect(parseNewDocumentParams({ type: "invoice", client: uuid, projectId: uuid })).toEqual({ type: "invoice", clientId: uuid, projectId: uuid });
  });
  it("accepts project as an alias", () => {
    expect(parseNewDocumentParams({ project: uuid }).projectId).toBe(uuid);
  });
  it("drops invalid values", () => {
    expect(parseNewDocumentParams({ type: "nonsense", client: "x", projectId: "y" })).toEqual({ type: null, clientId: null, projectId: null });
  });
  it("reads the long type names used in links", () => {
    expect(parseNewDocumentParams({ type: "local_purchase_order" }).type).toBe("local_purchase_order");
  });
});

describe("editorHrefForNew", () => {
  it("opens the editor fresh", () => expect(editorHrefForNew("abc")).toBe("/documents/abc?edit=1&fresh=1"));
});
