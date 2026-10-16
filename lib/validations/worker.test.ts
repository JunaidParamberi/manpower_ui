import { describe, expect, it } from "vitest";
import { workerInputSchema } from "./worker";

describe("workerInputSchema", () => {
  it("requires employee_id and name", () => {
    const result = workerInputSchema.safeParse({ employee_id: "", name: "" });
    expect(result.success).toBe(false);
  });

  it("defaults status to available", () => {
    const result = workerInputSchema.safeParse({
      employee_id: "EMP/2026/0099",
      name: "Test Worker",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("available");
    }
  });

  it("rejects an invalid status", () => {
    const result = workerInputSchema.safeParse({
      employee_id: "EMP/2026/0099",
      name: "Test Worker",
      status: "on_vacation",
    });
    expect(result.success).toBe(false);
  });

  it("coerces medical_fit/has_insurance checkbox strings to booleans", () => {
    const result = workerInputSchema.safeParse({
      employee_id: "EMP/2026/0099",
      name: "Test Worker",
      medical_fit: "true",
      has_insurance: "false",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.medical_fit).toBe(true);
      expect(result.data.has_insurance).toBe(false);
    }
  });
});
