import { z } from "zod";

export const DELETE_ACCOUNT_CONFIRMATION = "DELETE" as const;

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required."),
  confirmation: z
    .string()
    .refine((value) => value === DELETE_ACCOUNT_CONFIRMATION, {
      message: `Type ${DELETE_ACCOUNT_CONFIRMATION} to confirm.`,
    }),
  acknowledged: z.literal(true, {
    error: "You must acknowledge this action is permanent.",
  }),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const changeEmailSchema = z.object({
  newEmail: z.string().email("Enter a valid email address."),
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;

export const EXPORT_FORMATS = ["json", "csv", "pdf"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export function isExportFormat(value: string): value is ExportFormat {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}
