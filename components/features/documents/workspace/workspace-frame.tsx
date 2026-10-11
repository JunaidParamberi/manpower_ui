"use client";

import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

/**
 * Header on top, then the sunken paper canvas and the 300px settings rail.
 * Below `lg` the rail becomes a bottom sheet.
 */
export function WorkspaceFrame({
  header, canvasTop, paper, belowPaper, rail, railOpen, onRailOpenChange, railLabel, desktop,
}: {
  header: ReactNode;
  canvasTop?: ReactNode;
  paper: ReactNode;
  belowPaper?: ReactNode;
  rail: ReactNode;
  railOpen: boolean;
  onRailOpenChange: (open: boolean) => void;
  railLabel: string;
  /** At `lg` and up the rail is a column; below it a bottom sheet. Rendered once, so ids stay unique. */
  desktop: boolean;
}) {
  return (
    <div data-doc-workspace className="flex min-h-0 flex-1 flex-col lg:h-full">
      {header}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-3.5 overflow-auto bg-[var(--bg-sunken)] pt-4 pb-16 sm:px-6 sm:pt-7">
          {canvasTop}
          {paper}
          {belowPaper}
        </div>
        {desktop ? (
          <aside aria-label={railLabel} className="w-[300px] shrink-0 overflow-auto border-l border-border bg-[var(--panel)]">
            {rail}
          </aside>
        ) : null}
      </div>
      {!desktop ? (
        <Sheet open={railOpen} onOpenChange={onRailOpenChange}>
          <SheetContent side="bottom" className="max-h-[75dvh] gap-0 overflow-auto p-0">
            <SheetTitle className="sr-only">{railLabel}</SheetTitle>
            {rail}
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}
