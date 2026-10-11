import { describe, expect, it } from "vitest";

import { formatPasswordResetError } from "./password-reset-error";

describe("formatPasswordResetError", () => {
  it("shows a helpful message for Supabase auth rate limits", () => {
    expect(formatPasswordResetError(new Error("email rate limit exceeded"))).toBe(
      "Too many reset emails requested. Please wait a minute, then try again."
    );
    expect(
      formatPasswordResetError({
        code: "over_email_send_rate_limit",
        message: "For security purposes, you can only request this after 60 seconds.",
        status: 429,
      })
    ).toBe("Too many reset emails requested. Please wait a minute, then try again.");
  });

  it("uses a calm fallback for other reset failures", () => {
    expect(formatPasswordResetError(new Error("unexpected provider error"))).toBe(
      "We couldn't send a reset link. Please check the email address and try again."
    );
  });
});
