import { describe, it, expect } from "vitest";
import { parseComposedEmail } from "./composed-email";

describe("parseComposedEmail", () => {
  it("accepts a valid email", () => {
    const r = parseComposedEmail({ to: "a@b.com", subject: "Hi", body: "Hello there" });
    expect(r.ok).toBe(true);
  });
  it("rejects a bad address", () => {
    expect(parseComposedEmail({ to: "nope", subject: "Hi", body: "x" }).ok).toBe(false);
  });
  it("rejects empty body", () => {
    expect(parseComposedEmail({ to: "a@b.com", subject: "Hi", body: "" }).ok).toBe(false);
  });
  it("rejects overlong subject", () => {
    expect(parseComposedEmail({ to: "a@b.com", subject: "x".repeat(201), body: "y" }).ok).toBe(false);
  });
});

describe("parseComposedEmail — linked record", () => {
  const docId = "97bd5735-dc0f-4385-8f75-862520d3e3b9";
  it("accepts a document link with the PDF attached", () => {
    const r = parseComposedEmail({ to: "a@b.com", subject: "Hi", body: "x", documentId: docId, attachPdf: true });
    expect(r.ok).toBe(true);
  });
  it("rejects a non-uuid document id", () => {
    expect(parseComposedEmail({ to: "a@b.com", subject: "Hi", body: "x", documentId: "inv-8" }).ok).toBe(false);
  });
  it("rejects attachPdf without a document", () => {
    expect(parseComposedEmail({ to: "a@b.com", subject: "Hi", body: "x", attachPdf: true }).ok).toBe(false);
  });
});
