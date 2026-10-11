import { z } from "zod";

export const globalSearchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Enter at least one character.")
    .max(80, "Search query is too long."),
});

export type GlobalSearchInput = z.infer<typeof globalSearchSchema>;
