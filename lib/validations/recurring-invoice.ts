import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const isoDate = z.string().regex(isoDateRegex, "Use YYYY-MM-DD format.");

export const recurringLineItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required.").max(500),
  notes: z.string().trim().max(1000).nullish(),
  quantity: z.coerce.number().positive("Quantity must be positive."),
  unit_price: z.coerce.number().min(0, "Rate must be non-negative."),
  tax_rate: z.coerce.number().min(0).max(100).default(0),
  hsn_sac_code: z
    .union([
      z.string().regex(/^\d{4,8}$/, "HSN/SAC must be 4–8 digits."),
      z.null(),
    ])
    .optional(),
});

export type RecurringLineItemInput = z.infer<typeof recurringLineItemSchema>;

export const recurringInvoiceSchema = z.object({
  client_id: z.string().uuid("Invalid client."),
  project_id: z.union([z.string().uuid("Invalid project."), z.null()]).optional(),
  title: z.string().trim().min(1, "Title is required.").max(200),
  interval: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval_count: z.coerce.number().int().min(1).max(24),
  start_date: isoDate,
  end_date: z.union([isoDate, z.null()]).optional(),
  occurrences_limit: z
    .union([z.coerce.number().int().min(1), z.null()])
    .optional(),
  auto_send: z.boolean().default(false),
  net_days: z.coerce.number().int().min(0).max(180).default(7),
  currency: z.string().length(3, "Use a 3-letter currency code."),
  tax_mode: z
    .enum(["none", "vat", "gst", "cgst_sgst", "igst"])
    .default("none"),
  tax_rate: z.coerce.number().min(0).max(100).default(0),
  discount_type: z.enum(["percent", "flat"]).default("percent"),
  discount_value: z.coerce.number().min(0).default(0),
  notes_footer: z.string().max(2000).nullish(),
  payment_terms: z.string().max(500).nullish(),
  line_items: z
    .array(recurringLineItemSchema)
    .min(1, "Add at least one line item."),
});

export type RecurringInvoiceFormInput = z.input<typeof recurringInvoiceSchema>;
export type RecurringInvoiceInput = z.infer<typeof recurringInvoiceSchema>;

/** Inline schedule fields on the invoice editor (template comes from the invoice). */
export const invoiceRecurringScheduleSchema = z.object({
  interval: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval_count: z.coerce.number().int().min(1).max(24).default(1),
  start_date: isoDate,
  auto_send: z.boolean().default(false),
  net_days: z.coerce.number().int().min(0).max(180).default(7),
});

export type InvoiceRecurringScheduleInput = z.infer<
  typeof invoiceRecurringScheduleSchema
>;
