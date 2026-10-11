import type { ConsentAction, ConsentType } from "@/lib/validations/legal";

export type ConsentLogEntryInput = {
  userId: string;
  consentType: ConsentType;
  action: ConsentAction;
  policyVersion: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ConsentLogInsertRow = {
  user_id: string;
  consent_type: ConsentType;
  action: ConsentAction;
  policy_version: string | null;
  metadata: Record<string, unknown> | null;
};

export function buildConsentLogRow(
  input: ConsentLogEntryInput,
): ConsentLogInsertRow {
  return {
    user_id: input.userId,
    consent_type: input.consentType,
    action: input.action,
    policy_version: input.policyVersion,
    metadata: input.metadata ?? null,
  };
}

export function formatConsentTypeLabel(type: ConsentType): string {
  switch (type) {
    case "terms":
      return "Terms of Service";
    case "privacy":
      return "Privacy Policy";
    case "cookies":
      return "Cookie preferences";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function formatConsentActionLabel(action: ConsentAction): string {
  switch (action) {
    case "accepted":
      return "Accepted";
    case "updated":
      return "Updated";
    case "revoked":
      return "Revoked";
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
