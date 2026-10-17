import { z } from "zod";

export const PROJECT_CLIENT_LIMITS = {
  name: 300,
  client_code: 100,
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

export const projectClientInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required.").max(PROJECT_CLIENT_LIMITS.name),
  client_code: optionalString(PROJECT_CLIENT_LIMITS.client_code),
  license_number: optionalString(PROJECT_CLIENT_LIMITS.license_number),
  vat_number: optionalString(PROJECT_CLIENT_LIMITS.vat_number),
  contact_name: optionalString(PROJECT_CLIENT_LIMITS.contact_name),
  email: optionalString(PROJECT_CLIENT_LIMITS.email),
  phone: optionalString(PROJECT_CLIENT_LIMITS.phone),
  website: optionalString(PROJECT_CLIENT_LIMITS.website),
  notes: optionalString(PROJECT_CLIENT_LIMITS.notes),
});

export type ProjectClientInput = z.infer<typeof projectClientInputSchema>;
