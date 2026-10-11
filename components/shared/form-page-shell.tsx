import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Tailwind max-width tokens for readable form columns (centered). */
export type FormPageShellMaxWidth =
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "full";

const maxWidthClasses: Record<FormPageShellMaxWidth, string> = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-none",
};

export type FormPageShellProps = {
  children: ReactNode;
  className?: string;
  /**
   * Default matches a comfortable single-column / two-column form (~672px).
   * Use `3xl` or `4xl` for wider stacks (e.g. dense dashboards-in-forms).
   */
  maxWidth?: FormPageShellMaxWidth;
};

/**
 * Centers and constrains form-heavy page content so inputs do not stretch edge-to-edge.
 * Wrap route-level headings + form cards; keep full-bleed lists (e.g. CRM index) outside.
 */
export function FormPageShell({
  children,
  className,
  maxWidth = "2xl",
}: FormPageShellProps) {
  return (
    <div
      className={cn("mx-auto w-full min-w-0", maxWidthClasses[maxWidth], className)}
    >
      {children}
    </div>
  );
}
