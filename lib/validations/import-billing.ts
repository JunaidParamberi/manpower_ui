import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const isoDate = z.string().regex(isoDateRegex, "Use YYYY-MM-DD format.");

export const importBillingSchema = z.object({
  invoice_id: z.string().uuid("Invalid invoice."),
  project_id: z.string().uuid("Invalid project."),
  date_from: isoDate,
  date_to: isoDate,
  hourly_rate: z.coerce.number().min(0, "Rate must be non-negative."),
});
export type ImportBillingInput = z.infer<typeof importBillingSchema>;

export const previewBillingSchema = z.object({
  project_id: z.string().uuid("Invalid project."),
  date_from: isoDate,
  date_to: isoDate,
});
export type PreviewBillingInput = z.infer<typeof previewBillingSchema>;
