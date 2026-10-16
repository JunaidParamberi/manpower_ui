import { z } from "zod";

export const SUPPLIER_LIMITS = {
  name: 300,
  supplier_code: 100,
  license_number: 100,
  vat_number: 100,
  contact_name: 200,
  email: 320,
  phone: 50,
  website: 500,
  notes: 4000,
} as const;

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().default("");

export const supplierInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required.").max(SUPPLIER_LIMITS.name),
  supplier_code: optionalString(SUPPLIER_LIMITS.supplier_code),
  license_number: optionalString(SUPPLIER_LIMITS.license_number),
  vat_number: optionalString(SUPPLIER_LIMITS.vat_number),
  contact_name: optionalString(SUPPLIER_LIMITS.contact_name),
  email: optionalString(SUPPLIER_LIMITS.email),
  phone: optionalString(SUPPLIER_LIMITS.phone),
  website: optionalString(SUPPLIER_LIMITS.website),
  notes: optionalString(SUPPLIER_LIMITS.notes),
});

export type SupplierInput = z.infer<typeof supplierInputSchema>;
