import { z } from "zod";

export const TEMPLATE_LIMITS = {
  name: 160,
  description: 2000,
  milestoneTitle: 255,
  milestoneDescription: 2000,
  taskTitle: 300,
  taskDescription: 2000,
} as const;

export const templateNameSchema = z
  .string()
  .trim()
  .min(1, "Template name is required.")
  .max(TEMPLATE_LIMITS.name, `Template name must be ${TEMPLATE_LIMITS.name} characters or less.`);

export const saveAsTemplateSchema = z.object({
  name: templateNameSchema,
  projectId: z.string().uuid("Invalid project ID."),
  description: z
    .string()
    .trim()
    .max(
      TEMPLATE_LIMITS.description,
      `Description must be ${TEMPLATE_LIMITS.description} characters or less.`,
    )
    .optional()
    .or(z.literal("")),
});

export type SaveAsTemplateInput = z.infer<typeof saveAsTemplateSchema>;

export const renameTemplateSchema = z.object({
  templateId: z.string().uuid("Invalid template ID."),
  name: templateNameSchema,
});

export type RenameTemplateInput = z.infer<typeof renameTemplateSchema>;
