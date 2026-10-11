import { z } from "zod";
import { taxModeSchema } from "@/lib/documents/tax/compute-tax";

export const SERVICE_TYPES = ["service", "product", "asset"] as const;
export type ServiceTypeValue = (typeof SERVICE_TYPES)[number];

export const SERVICE_TYPE_LABELS: Record<ServiceTypeValue, string> = {
  service: "Service",
  product: "Product",
  asset: "Asset",
};

export const serviceTypeSchema = z.enum(SERVICE_TYPES);

export const SERVICE_UNITS = [
  "hr", "day", "week", "month",
  "project", "word", "page", "item",
  "license", "seat", "gb",
] as const;
export type ServiceUnitValue = (typeof SERVICE_UNITS)[number];

export const SERVICE_UNIT_LABELS: Record<ServiceUnitValue, string> = {
  hr:      "Per hour",
  day:     "Per day",
  week:    "Per week",
  month:   "Per month",
  project: "Per project",
  word:    "Per word",
  page:    "Per page",
  item:    "Per item",
  license: "Per license",
  seat:    "Per seat",
  gb:      "Per GB",
};

export const serviceUnitSchema = z.enum(SERVICE_UNITS);

export const serviceInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, "Name is required").max(200),
    description: z.string().max(500).default(""),
    service_type: serviceTypeSchema.default("service"),
    unit: serviceUnitSchema.default("item"),
    sku: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() || null : v),
      z.string().max(100).nullish(),
    ).optional(),
    default_qty: z.coerce.number().min(0.01, "Qty must be at least 0.01").default(1),
    cost_price: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : v),
      z.coerce.number().min(0).nullish(),
    ).optional(),
    default_rate: z.coerce.number().min(0).default(0),
    default_tax_mode: taxModeSchema.default("none"),
    default_tax_rate: z.coerce.number().min(0).max(100).default(0),
    hsn_sac_code: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() || null : v),
      z.string().regex(/^\d{4,8}$/, "HSN/SAC must be 4–8 digits").nullish(),
    ).optional(),
  })
  .transform((v) =>
    v.default_tax_mode === "none" ? { ...v, default_tax_rate: 0 } : v
  );

export type ServiceInput = z.infer<typeof serviceInputSchema>;
