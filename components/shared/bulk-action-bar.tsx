"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BulkActionBarProps = {
  count: number;
  onClearSelection: () => void;
  children: React.ReactNode;
};

export function BulkActionBar({
  count,
  onClearSelection,
  children,
}: BulkActionBarProps) {
  const visible = count > 0;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 transition-all duration-200",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-card px-4 py-2.5 shadow-[var(--shadow-lg)] ring-1 ring-border/50",
          !visible && "pointer-events-none",
        )}
        aria-hidden={!visible}
      >
        <span className="min-w-[5rem] text-sm font-medium tabular-nums text-foreground">
          {count} selected
        </span>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">{children}</div>
        <div className="h-4 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClearSelection}
          aria-label="Clear selection"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
