import { describe, expect, it } from "vitest";

import { createSafePdfFilename } from "./generate-pdf-buffer";

describe("createSafePdfFilename", () => {
  it("uses the document number when available", () => {
    expect(createSafePdfFilename("INV-001", "Fallback title")).toBe("INV-001");
  });

  it("strips unsafe filename characters", () => {
    expect(createSafePdfFilename(null, "Proposal: ACME / Q2?")).toBe(
      "Proposal ACME  Q2",
    );
  });

  it("falls back to document when the title has no safe characters", () => {
    expect(createSafePdfFilename(null, "///???")).toBe("document");
  });
});
