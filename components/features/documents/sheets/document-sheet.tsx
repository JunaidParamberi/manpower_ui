import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

type DocumentSheetProps = {
  children: React.ReactNode;
  /** CSS variant class: "sheet--mono" | "sheet--brand" | "sheet--serif" | "sheet--cover" */
  variant?: string;
  className?: string;
  accentColor?: string | null;
};

function sheetAccentStyle(accentColor?: string | null): CSSProperties | undefined {
  if (!accentColor) return undefined;
  return {
    ["--sheet-accent" as string]: accentColor,
    ["--sheet-accent-soft" as string]: `${accentColor}22`,
  };
}

/**
 * A4 document wrapper. Uses raw CSS from styles/document-sheet.css.
 * Responsive below md (reflow); fixed 800px canvas on desktop. Print-safe.
 */
export function DocumentSheet({
  children,
  variant,
  className,
  accentColor,
}: DocumentSheetProps) {
  return (
    <div className="sheet-canvas">
      <div
        className={cn("sheet", variant, className)}
        style={sheetAccentStyle(accentColor)}
      >
        {children}
      </div>
    </div>
  );
}
