import { describe, expect, it } from "vitest";

import {
  DELETE_ACCOUNT_CONFIRMATION,
  deleteAccountSchema,
} from "@/lib/validations/account";

describe("deleteAccountSchema", () => {
  it("requires acknowledgement checkbox", () => {
    const result = deleteAccountSchema.safeParse({
      password: "secret123",
      confirmation: DELETE_ACCOUNT_CONFIRMATION,
      acknowledged: false,
    });
    expect(result.success).toBe(false);
  });
});
