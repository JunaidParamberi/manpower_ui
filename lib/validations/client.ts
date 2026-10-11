import { z } from "zod";

/** Align with DB constraints (migration `*_clients.sql`). */
export const CLIENT_LIMITS = {
  name: 300,
  contact_name: 200,
  email: 320,
  website: 500,
  phone: 50,
  company: 200,
  address: 2000,
  tax_id: 100,
  lead_source: 100,
  timezone: 100,
  tag: 40,
  tags: 20,
  notes: 8000,
} as const;

export const CLIENT_RELATIONSHIP_STATUSES = [
  "lead",
  "active",
  "paused",
  "past",
  "archived",
] as const;

export const CLIENT_PREFERRED_CONTACT_METHODS = [
  "email",
  "phone",
  "whatsapp",
  "none",
] as const;

export type ClientRelationshipStatus =
  (typeof CLIENT_RELATIONSHIP_STATUSES)[number];
export type ClientPreferredContactMethod =
  (typeof CLIENT_PREFERRED_CONTACT_METHODS)[number];

const optionalString = (max: number) => z.string().trim().max(max).optional().default("");

export const clientCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(CLIENT_LIMITS.name),
  website: optionalString(CLIENT_LIMITS.website),
  email: optionalString(CLIENT_LIMITS.email),
  billing_email: optionalString(CLIENT_LIMITS.email),
  phone: optionalString(CLIENT_LIMITS.phone),
  company: optionalString(CLIENT_LIMITS.company),
  contact_name: optionalString(CLIENT_LIMITS.contact_name),
  address: optionalString(CLIENT_LIMITS.address),
  currency: z.string().trim().optional().default(""),
  tax_id: optionalString(CLIENT_LIMITS.tax_id),
  payment_terms_days: z.string().trim().optional().default(""),
  relationship_status: z.string().trim().optional().default("active"),
  lead_source: optionalString(CLIENT_LIMITS.lead_source),
  preferred_contact_method: z.string().trim().optional().default(""),
  timezone: optionalString(CLIENT_LIMITS.timezone),
  tags: z.string().trim().optional().default(""),
  notes: optionalString(CLIENT_LIMITS.notes),
});

export type ClientCreateFormInput = z.input<typeof clientCreateSchema>;

/** Normalized payload for insert (empty strings → null). */
export type ClientCreatePayload = {
  name: string;
  contact_name: string | null;
  website: string | null;
  email: string | null;
  billing_email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  currency: string | null;
  tax_id: string | null;
  payment_terms_days: number | null;
  relationship_status: ClientRelationshipStatus;
  lead_source: string | null;
  preferred_contact_method: ClientPreferredContactMethod | null;
  timezone: string | null;
  tags: string[];
  notes: string | null;
};

type ClientValidationIssue = {
  code: "custom";
  message: string;
  path: Array<string | number>;
};

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasValue<T extends readonly string[]>(
  values: T,
  value: string,
): value is T[number] {
  return values.includes(value as T[number]);
}

function parseOptionalEmail(
  value: string,
  path: string,
  message: string,
  issues: ClientValidationIssue[],
): string | null {
  const email = value.trim();
  if (email === "") {
    return null;
  }
  if (!isEmail(email)) {
    issues.push({ code: "custom", message, path: [path] });
  }
  return email;
}

function parsePaymentTermsDays(
  value: string,
  issues: ClientValidationIssue[],
): number | null {
  const raw = value.trim();
  if (raw === "") {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 365) {
    issues.push({
      code: "custom",
      message: "Payment terms must be between 0 and 365 days.",
      path: ["payment_terms_days"],
    });
    return null;
  }
  return parsed;
}

function parseTags(value: string, issues: ClientValidationIssue[]): string[] {
  const seen = new Set<string>();
  const tags = value
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

  if (tags.length > CLIENT_LIMITS.tags) {
    issues.push({
      code: "custom",
      message: `Use ${CLIENT_LIMITS.tags} tags or fewer.`,
      path: ["tags"],
    });
  }

  if (tags.some((tag) => tag.length > CLIENT_LIMITS.tag)) {
    issues.push({
      code: "custom",
      message: `Each tag must be ${CLIENT_LIMITS.tag} characters or fewer.`,
      path: ["tags"],
    });
  }

  return tags;
}

export function parseClientCreateInput(
  raw: unknown,
):
  | { success: true; data: ClientCreatePayload }
  | { success: false; error: z.ZodError } {
  const parsed = clientCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const d = parsed.data;
  const issues: ClientValidationIssue[] = [];
  const email = parseOptionalEmail(d.email, "email", "Invalid email.", issues);
  const billingEmail = parseOptionalEmail(
    d.billing_email,
    "billing_email",
    "Invalid billing email.",
    issues,
  );
  const paymentTermsDays = parsePaymentTermsDays(d.payment_terms_days, issues);

  const relationshipStatusRaw = d.relationship_status.trim() || "active";
  const relationshipStatus = hasValue(
    CLIENT_RELATIONSHIP_STATUSES,
    relationshipStatusRaw,
  )
    ? relationshipStatusRaw
    : null;
  if (relationshipStatus === null) {
    issues.push({
      code: "custom",
      message: "Invalid client status.",
      path: ["relationship_status"],
    });
  }

  const contactMethodRaw = d.preferred_contact_method.trim();
  const preferredContactMethod =
    contactMethodRaw === ""
      ? null
      : hasValue(CLIENT_PREFERRED_CONTACT_METHODS, contactMethodRaw)
        ? contactMethodRaw
        : null;
  if (contactMethodRaw !== "" && preferredContactMethod === null) {
    issues.push({
      code: "custom",
      message: "Invalid preferred contact method.",
      path: ["preferred_contact_method"],
    });
  }

  const tags = parseTags(d.tags, issues);

  if (issues.length > 0) {
    return {
      success: false,
      error: new z.ZodError(issues),
    };
  }

  const currencyRaw = d.currency.trim().toUpperCase();
  const currency = currencyRaw === "" ? null : currencyRaw;
  if (currency !== null && !/^[A-Z]{3}$/.test(currency)) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: "custom",
          message: "Use a 3-letter ISO 4217 currency code (e.g. USD).",
          path: ["currency"],
        },
      ]),
    };
  }

  const emptyToNull = (s: string) => {
    const t = s.trim();
    return t === "" ? null : t;
  };

  return {
    success: true,
    data: {
      name: d.name.trim(),
      contact_name: emptyToNull(d.contact_name),
      website: emptyToNull(d.website),
      email,
      billing_email: billingEmail,
      phone: emptyToNull(d.phone),
      company: emptyToNull(d.company),
      address: emptyToNull(d.address),
      currency,
      tax_id: emptyToNull(d.tax_id),
      payment_terms_days: paymentTermsDays,
      relationship_status: relationshipStatus ?? "active",
      lead_source: emptyToNull(d.lead_source),
      preferred_contact_method: preferredContactMethod,
      timezone: emptyToNull(d.timezone),
      tags,
      notes: emptyToNull(d.notes),
    },
  };
}
