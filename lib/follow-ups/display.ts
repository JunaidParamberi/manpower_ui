import type { FollowUpTone } from "@/lib/follow-ups/ladder";
import type { FollowUpTriggerType } from "@/types";

/** Reads a display fact, falling back when the snapshot predates a field. */
function text(facts: Record<string, string | number>, key: string): string {
  const value = facts[key];
  return value === undefined || value === null ? "" : String(value);
}

function count(facts: Record<string, string | number>, key: string): number {
  const value = Number(facts[key]);
  return Number.isFinite(value) ? value : 0;
}

function days(n: number): string {
  return `${n} day${n === 1 ? "" : "s"}`;
}

function money(facts: Record<string, string | number>): string {
  const currency = text(facts, "currency");
  const amount = count(facts, "amount");
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(amount);
  return currency ? `${currency} ${formatted}` : formatted;
}

function documentLabel(facts: Record<string, string | number>): string {
  const type = text(facts, "documentType");
  const noun =
    type === "quote" ? "Quote" : type === "proposal" ? "Proposal" : "Invoice";
  const number = text(facts, "documentNumber");
  return number ? `${noun} ${number}` : noun;
}

/**
 * One-line reason shown under the client name. Reads from the detection-time
 * snapshot, so it describes the situation when the nudge was raised.
 */
export function followUpReason(
  triggerType: FollowUpTriggerType,
  facts: Record<string, string | number>,
): string {
  switch (triggerType) {
    case "invoice_overdue":
      return `${documentLabel(facts)} · ${money(facts)} · ${days(
        count(facts, "daysOverdue"),
      )} overdue`;
    case "invoice_due_soon": {
      const daysUntil = count(facts, "daysUntilDue");
      const when = daysUntil === 0 ? "due today" : `due in ${days(daysUntil)}`;
      return `${documentLabel(facts)} · ${money(facts)} · ${when}`;
    }
    case "document_unanswered":
      return `${documentLabel(facts)} · no reply in ${days(
        count(facts, "daysSinceSent"),
      )}`;
    case "project_stale": {
      const title = text(facts, "projectTitle") || "Project";
      return `${title} · quiet for ${days(count(facts, "daysIdle"))}`;
    }
  }
}

/** Short label for the tone chip. */
export const TONE_LABEL: Record<FollowUpTone, string> = {
  friendly: "Friendly",
  firm: "Firm",
  formal: "Formal",
};

/** Button label — a check-in is not a chase, so it does not say "reminder". */
export function draftActionLabel(triggerType: FollowUpTriggerType): string {
  return triggerType === "project_stale" ? "Draft check-in" : "Draft reminder";
}
