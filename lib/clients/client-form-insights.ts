import type { ClientCreateFormInput } from "@/lib/validations/client";

type CompletionItem = {
  id: "name" | "contact" | "status";
  label: string;
  complete: boolean;
};

export type ClientFormInsights = {
  displayName: string;
  relationshipLabel: string;
  primaryContactLabel: string;
  billingRouteLabel: string;
  paymentTermsLabel: string;
  tags: string[];
  completionItems: CompletionItem[];
  completedCount: number;
  totalCount: number;
  completionPercent: number;
  missingEssentials: string[];
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  lead: "Lead",
  active: "Active client",
  paused: "Paused",
  past: "Past client",
  archived: "Archived",
};

function text(value: string | number | undefined): string {
  if (value === undefined) {
    return "";
  }
  return String(value).trim();
}

function splitTags(value: string | undefined): string[] {
  const seen = new Set<string>();
  return text(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function completionPercent(completedCount: number, totalCount: number): number {
  if (totalCount === 0) {
    return 0;
  }
  return Math.round((completedCount / totalCount) * 100);
}

export function buildClientFormInsights(
  values: ClientCreateFormInput,
): ClientFormInsights {
  const name = text(values.name);
  const contactName = text(values.contact_name);
  const email = text(values.email);
  const billingEmail = text(values.billing_email);
  const phone = text(values.phone);
  const relationshipStatus = text(values.relationship_status) || "active";
  const paymentTerms = text(values.payment_terms_days);

  const completionItems: CompletionItem[] = [
    { id: "name", label: "Display name", complete: Boolean(name) },
    { id: "contact", label: "Email or phone", complete: Boolean(email || phone) },
    { id: "status", label: "Relationship status", complete: Boolean(relationshipStatus) },
  ];
  const completedCount = completionItems.filter((item) => item.complete).length;
  const missingEssentials = completionItems
    .filter((item) => !item.complete)
    .map((item) => {
      switch (item.id) {
        case "name":
          return "Add a display name";
        case "contact":
          return "Add an email or phone";
        case "status":
          return "Choose a relationship status";
      }
    });

  return {
    displayName: name || "Untitled client",
    relationshipLabel: RELATIONSHIP_LABELS[relationshipStatus] ?? "Active client",
    primaryContactLabel: contactName || email || phone || "No contact route yet",
    billingRouteLabel: billingEmail || "Uses primary email unless added",
    paymentTermsLabel: paymentTerms ? `${paymentTerms} days` : "No default terms",
    tags: splitTags(values.tags),
    completionItems,
    completedCount,
    totalCount: completionItems.length,
    completionPercent: completionPercent(completedCount, completionItems.length),
    missingEssentials,
  };
}
