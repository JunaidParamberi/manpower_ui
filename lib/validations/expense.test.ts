import { describe, expect, it } from "vitest";

import {
  EXPENSE_NONE_PROJECT_VALUE,
  parseExpenseCreateInput,
  parseExpenseUpdateInput,
} from "@/lib/validations/expense";

function validBase() {
  return {
    category: "software" as const,
    amount: "49.99",
    currency: "USD",
    date: "2026-05-15",
    project_id: "",
    vendor: "",
    notes: "",
  };
}

describe("parseExpenseCreateInput", () => {
  it("accepts minimal payload", () => {
    const result = parseExpenseCreateInput(validBase());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("software");
      expect(result.data.amount).toBe(49.99);
      expect(result.data.currency).toBe("USD");
      expect(result.data.project_id).toBeNull();
      expect(result.data.vendor).toBeNull();
    }
  });

  it("normalizes project_id sentinel to null", () => {
    const result = parseExpenseCreateInput({
      ...validBase(),
      project_id: EXPENSE_NONE_PROJECT_VALUE,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project_id).toBeNull();
    }
  });

  it("accepts valid project uuid", () => {
    const projectId = "550e8400-e29b-41d4-a716-446655440000";
    const result = parseExpenseCreateInput({
      ...validBase(),
      project_id: projectId,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project_id).toBe(projectId);
    }
  });

  it("rejects invalid category", () => {
    const result = parseExpenseCreateInput({
      ...validBase(),
      category: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid currency", () => {
    const result = parseExpenseCreateInput({
      ...validBase(),
      currency: "US",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero or negative amount", () => {
    expect(parseExpenseCreateInput({ ...validBase(), amount: "0" }).success).toBe(
      false,
    );
    expect(
      parseExpenseCreateInput({ ...validBase(), amount: "-10" }).success,
    ).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = parseExpenseCreateInput({
      ...validBase(),
      date: "05/15/2026",
    });
    expect(result.success).toBe(false);
  });
});

describe("parseExpenseUpdateInput", () => {
  it("requires valid id", () => {
    const result = parseExpenseUpdateInput({
      ...validBase(),
      id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts id with create fields", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const result = parseExpenseUpdateInput({
      ...validBase(),
      id,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(id);
    }
  });
});
