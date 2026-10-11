import { z } from "zod";

import type {
  DocumentStatus,
  DocumentType,
  TiptapDoc,
} from "@/types";
import { taxModeSchema } from "@/lib/documents/tax/compute-tax";

/** Align with DB constraints (migration `*_documents.sql`). */
export const DOCUMENT_LIMITS = {
  title: 300,
  template_name: 200,
  template_description: 500,
} as const;

export const DOCUMENT_TYPES = [
  "proposal",
  "quote",
  "invoice",
  "receipt",
  "local_purchase_order",
  "other",
  "statement",
  "credit_note",
  "delivery_note",
] as const satisfies readonly DocumentType[];

/** Types a user may create by hand. Receipts are system-generated;
 *  statement/credit_note/delivery_note have no implementation yet. */
export const CREATABLE_DOCUMENT_TYPES = [
  "proposal",
  "quote",
  "invoice",
  "local_purchase_order",
  "other",
] as const satisfies readonly DocumentType[];

export const DOCUMENT_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "signed",
  "paid",
  "partially_paid",
  "written_off",
  "archived",
  "approved",
  "declined",
  "voided",
] as const satisfies readonly DocumentStatus[];

export const documentTypeSchema = z.enum(DOCUMENT_TYPES);
export const documentStatusSchema = z.enum(DOCUMENT_STATUSES);

const uuidOrEmpty = z
  .string()
  .trim()
  .refine((v) => v === "" || /^[0-9a-f-]{36}$/i.test(v), {
    message: "Invalid id.",
  });

/**
 * Tiptap content schema. We accept any object whose root `type` is "doc" and
 * whose `content` (if present) is an array. Full validation lives in the
 * editor; we just block obviously bad payloads from hitting the DB.
 */
export const tiptapDocSchema: z.ZodType<TiptapDoc> = z
  .object({
    type: z.string().min(1),
  })
  .catchall(z.unknown())
  .refine(
    (doc) => doc.type === "doc",
    { message: "Tiptap document root must be of type 'doc'." },
  )
  .refine(
    (doc) => {
      const content = (doc as { content?: unknown }).content;
      return content === undefined || Array.isArray(content);
    },
    { message: "Tiptap content must be an array." },
  ) as unknown as z.ZodType<TiptapDoc>;

export const documentInputSchema = z.object({
  // Blank means "name it for me" — see lib/documents/auto-title.ts.
  title: z
    .string()
    .trim()
    .max(DOCUMENT_LIMITS.title, `Title must be ${DOCUMENT_LIMITS.title} characters or fewer.`)
    .default(""),
  type: documentTypeSchema,
  status: documentStatusSchema.optional(),
  client_id: uuidOrEmpty.optional(),
  project_id: uuidOrEmpty.optional(),
  content_json: tiptapDocSchema,
  internal_notes: z.string().max(5000).optional(),
});

export type DocumentInputForm = z.input<typeof documentInputSchema>;

export type DocumentInputPayload = {
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  client_id: string | null;
  project_id: string | null;
  content_json: TiptapDoc;
  internal_notes: string | null;
};

export const documentPropertiesInputSchema = z
  .object({
    // Blank means "name it for me" — see lib/documents/auto-title.ts.
    title: z
      .string()
      .trim()
      .max(
        DOCUMENT_LIMITS.title,
        `Title must be ${DOCUMENT_LIMITS.title} characters or fewer.`,
      )
      .default(""),
    type: documentTypeSchema,
    // Drafts may be saved without a client; sending requires one
    // (lib/documents/readiness.ts).
    client_id: uuidOrEmpty.optional(),
    project_id: uuidOrEmpty.optional(),
    content_json: tiptapDocSchema.optional(),
  })
  .strict();

export type DocumentPropertiesInputPayload = {
  title: string;
  type: DocumentType;
  client_id: string | null;
  project_id: string | null;
  content_json?: TiptapDoc;
};

const EMPTY_DOC: TiptapDoc = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function emptyTiptapDoc(): TiptapDoc {
  // Deep copy so callers can mutate freely.
  return JSON.parse(JSON.stringify(EMPTY_DOC)) as TiptapDoc;
}

export function parseDocumentInput(
  raw: unknown,
):
  | { success: true; data: DocumentInputPayload }
  | { success: false; error: z.ZodError } {
  const parsed = documentInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const d = parsed.data;
  const clientId =
    d.client_id && d.client_id.trim() !== "" ? d.client_id.trim() : null;
  const projectId =
    d.project_id && d.project_id.trim() !== "" ? d.project_id.trim() : null;

  return {
    success: true,
    data: {
      title: d.title.trim(),
      type: d.type,
      status: d.status ?? "draft",
      client_id: clientId,
      project_id: projectId,
      content_json: d.content_json,
      internal_notes: d.internal_notes ?? null,
    },
  };
}

export function parseDocumentPropertiesInput(
  raw: unknown,
):
  | { success: true; data: DocumentPropertiesInputPayload }
  | { success: false; error: z.ZodError } {
  const parsed = documentPropertiesInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const d = parsed.data;
  const projectId =
    d.project_id && d.project_id.trim() !== "" ? d.project_id.trim() : null;
  const clientId =
    d.client_id && d.client_id.trim() !== "" ? d.client_id.trim() : null;

  return {
    success: true,
    data: {
      title: d.title.trim(),
      type: d.type,
      client_id: clientId,
      project_id: projectId,
      content_json: d.content_json,
    },
  };
}

/** Subset accepted when a user saves a document as a new template. */
export const templateInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Template name is required.")
    .max(
      DOCUMENT_LIMITS.template_name,
      `Name must be ${DOCUMENT_LIMITS.template_name} characters or fewer.`,
    ),
  description: z
    .string()
    .trim()
    .max(
      DOCUMENT_LIMITS.template_description,
      `Description must be ${DOCUMENT_LIMITS.template_description} characters or fewer.`,
    )
    .optional(),
  type: documentTypeSchema,
  content_json: tiptapDocSchema,
});

export type TemplateInputForm = z.input<typeof templateInputSchema>;

export type TemplateInputPayload = {
  name: string;
  description: string | null;
  type: DocumentType;
  content_json: TiptapDoc;
};

export function parseTemplateInput(
  raw: unknown,
):
  | { success: true; data: TemplateInputPayload }
  | { success: false; error: z.ZodError } {
  const parsed = templateInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const d = parsed.data;
  const description =
    d.description && d.description.trim() !== "" ? d.description.trim() : null;

  return {
    success: true,
    data: {
      name: d.name.trim(),
      description,
      type: d.type,
      content_json: d.content_json,
    },
  };
}

export const quoteMetaSchema = z.object({
  quote_number:   z.string().max(100).optional().nullable(),
  valid_until:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes_footer:   z.string().max(1000).optional().nullable(),
  discount_value: z.coerce.number().min(0).default(0).optional(),
  discount_type:  z.enum(['percent', 'flat']).default('percent').optional(),
  tax_mode: taxModeSchema.default("none"),
  tax_rate: z.coerce.number().min(0).max(100).default(0),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/).optional(),
  fx_rate: z.coerce.number().positive().nullable().optional(),
});

export type QuoteMetaInput = z.infer<typeof quoteMetaSchema>;

export const invoiceMetaSchema = z.object({
  invoice_number: z.string().max(100).optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  payment_terms: z.string().max(200).optional().nullable(),
  notes_footer: z.string().max(1000).optional().nullable(),
  discount_value: z.coerce.number().min(0).default(0).optional(),
  discount_type: z.enum(['percent', 'flat']).default('percent').optional(),
  lpo_reference_number: z.string().trim().max(100).nullable().optional(),
  tax_mode: taxModeSchema.default("none"),
  tax_rate: z.coerce.number().min(0).max(100).default(0),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/).optional(),
  fx_rate: z.coerce.number().positive().nullable().optional(),
  tds_enabled: z.boolean().default(false),
  tds_rate: z.coerce.number().min(0).max(100).default(0),
}).transform((v) => (v.tds_enabled === false ? { ...v, tds_rate: 0 } : v));

export type InvoiceMetaInput = z.infer<typeof invoiceMetaSchema>;

const proposalDeliverableSchema = z.object({
  num: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  hours: z.number().min(0).optional().nullable(),
});

const proposalTimelinePhaseSchema = z.object({
  name: z.string().min(1),
  start_week: z.number().int().min(1),
  span_weeks: z.number().int().min(1),
  color: z.enum(["accent", "dark", "soft", "ghost"]).optional().default("dark"),
});

export const proposalContentSchema = z.object({
  headline: z.string().max(200).optional().nullable(),
  headline_accent: z.string().max(100).optional().nullable(),
  subhead: z.string().max(500).optional().nullable(),
  investment_range: z.string().max(100).optional().nullable(),
  opportunity: z.string().max(2000).optional().nullable(),
  opportunity_detail: z.string().max(2000).optional().nullable(),
  deliverables: z.array(proposalDeliverableSchema).optional().default([]),
  timeline: z.array(proposalTimelinePhaseSchema).optional().default([]),
  timeline_weeks: z.number().int().min(1).max(52).optional().default(8),
  milestones: z.array(z.string()).optional().default([]),
  next_step_text: z.string().max(1000).optional().nullable(),
});

export type ProposalContent = z.infer<typeof proposalContentSchema>;

export const proposalMetaSchema = z.object({
  proposal_number: z.string().max(100).optional().nullable(),
  valid_until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional()
    .nullable(),
  notes_footer: z.string().max(1000).optional().nullable(),
  discount_value: z.coerce.number().min(0).optional().default(0),
  discount_type: z.enum(["percent", "flat"]).optional().default("percent"),
  proposal_content: proposalContentSchema.optional().nullable(),
});

export type ProposalMetaInput = z.infer<typeof proposalMetaSchema>;

export const lpoMetaSchema = z.object({
  lpo_number: z.string().trim().min(1, "LPO number is required.").max(100),
  lpo_validity_date: z.string().nullable().optional(),
  lpo_amount: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const n = Number(val);
      return isNaN(n) ? undefined : n;
    },
    z.number().positive("Amount must be positive.").optional(),
  ),
});

export type LPOMetaInput = z.infer<typeof lpoMetaSchema>;

export const voidDocumentSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().min(5, "Reason must be at least 5 characters.").max(500),
});

export type VoidDocumentInput = z.infer<typeof voidDocumentSchema>;
