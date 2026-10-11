import { describe, expect, it } from "vitest";
import {
  saveAsTemplateSchema,
  renameTemplateSchema,
  TEMPLATE_LIMITS,
} from "./project-template";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("saveAsTemplateSchema", () => {
  it("accepts valid input", () => {
    const result = saveAsTemplateSchema.safeParse({
      name: "My template",
      projectId: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from name", () => {
    const result = saveAsTemplateSchema.safeParse({
      name: "  My template  ",
      projectId: VALID_UUID,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My template");
    }
  });

  it("rejects empty name", () => {
    const result = saveAsTemplateSchema.safeParse({
      name: "",
      projectId: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over limit", () => {
    const result = saveAsTemplateSchema.safeParse({
      name: "a".repeat(TEMPLATE_LIMITS.name + 1),
      projectId: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid projectId", () => {
    const result = saveAsTemplateSchema.safeParse({
      name: "My template",
      projectId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional description", () => {
    const result = saveAsTemplateSchema.safeParse({
      name: "My template",
      projectId: VALID_UUID,
      description: "Reusable website flow",
    });
    expect(result.success).toBe(true);
  });
});

describe("renameTemplateSchema", () => {
  it("accepts valid input", () => {
    const result = renameTemplateSchema.safeParse({
      templateId: VALID_UUID,
      name: "Renamed template",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid templateId", () => {
    const result = renameTemplateSchema.safeParse({
      templateId: "bad",
      name: "My template",
    });
    expect(result.success).toBe(false);
  });

  it("rejects blank name", () => {
    const result = renameTemplateSchema.safeParse({
      templateId: VALID_UUID,
      name: "   ",
    });
    expect(result.success).toBe(false);
  });
});
