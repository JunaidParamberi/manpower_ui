const RATE_LIMIT_MESSAGE =
  "Too many reset emails requested. Please wait a minute, then try again.";

const FALLBACK_MESSAGE =
  "We couldn't send a reset link. Please check the email address and try again.";

function fieldText(error: Record<string, unknown>, field: string): string {
  const value = error[field];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export function formatPasswordResetError(error: unknown): string {
  const parts: string[] = [];

  if (error instanceof Error) {
    parts.push(error.message);
  } else if (typeof error === "string") {
    parts.push(error);
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    parts.push(fieldText(record, "message"));
    parts.push(fieldText(record, "code"));
    parts.push(fieldText(record, "status"));
    parts.push(fieldText(record, "error_code"));
  }

  const text = parts.join(" ").toLowerCase();

  if (
    text.includes("rate limit") ||
    text.includes("over_email_send_rate_limit") ||
    text.includes("too many") ||
    text.includes("429") ||
    text.includes("security purposes")
  ) {
    return RATE_LIMIT_MESSAGE;
  }

  return FALLBACK_MESSAGE;
}
