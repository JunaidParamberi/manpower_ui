// Storybook mock for lib/email/send-composed-email.ts.
//
// The real module is a "use server" action that calls Resend and requires an
// authenticated Supabase session (getServerContext) — neither is available in
// Storybook, so this module is aliased in .storybook/main.ts in place of the
// real one. Behavior is driven by magic subject-line sentinels so a single
// story file can exercise success, failure, and a pending/never-resolving
// send without needing per-story module swapping:
//   - subject === "__STORYBOOK_SIMULATE_FAILURE__" -> resolves { ok: false }
//   - subject === "__STORYBOOK_SIMULATE_PENDING__"  -> never resolves
//   - anything else                                  -> resolves { ok: true }
export const STORYBOOK_SIMULATE_FAILURE_SUBJECT = "__STORYBOOK_SIMULATE_FAILURE__";
export const STORYBOOK_SIMULATE_PENDING_SUBJECT = "__STORYBOOK_SIMULATE_PENDING__";

export async function sendComposedEmail(
  input: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const subject =
    input && typeof input === "object" && "subject" in input
      ? (input as { subject?: unknown }).subject
      : undefined;

  if (subject === STORYBOOK_SIMULATE_PENDING_SUBJECT) {
    return new Promise(() => {
      // Intentionally never resolves — used to freeze the composer in its
      // "sending" state for the disabled-button story.
    });
  }

  if (subject === STORYBOOK_SIMULATE_FAILURE_SUBJECT) {
    return { ok: false, message: "Resend rejected the message: invalid recipient." };
  }

  return { ok: true };
}
