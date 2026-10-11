"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type RailFieldProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: string;
  children: ReactNode;
  open?: boolean;
  warn?: boolean;
};

/** One rail row: label left, value token right. The whole row is the target. */
export const RailField = forwardRef<HTMLButtonElement, RailFieldProps>(function RailField(
  { label, children, open, warn, disabled, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      data-open={open ? "" : undefined}
      className={cn(
        "group flex min-h-9 w-full items-center justify-between gap-2.5 rounded-[var(--item-radius)] py-1 pr-1.5 pl-2 text-left text-[13px]",
        "hover:bg-[var(--bg-subtle)] data-[open]:bg-[var(--accent-soft)] data-[popup-open]:bg-[var(--accent-soft)] disabled:cursor-default disabled:hover:bg-transparent",
        "focus-visible:outline-2 focus-visible:outline-[var(--accent)]",
        className,
      )}
      {...rest}
    >
      <span className="shrink-0 text-[var(--fg-2)]">{label}</span>
      <span className={cn("flex min-w-0 items-center gap-1.5 font-medium", warn && "text-[var(--warning)]")}>
        {children}
        {!disabled ? (
          <ChevronDown aria-hidden className="size-3 shrink-0 text-[var(--fg-3)] opacity-0 transition-opacity group-hover:opacity-100 group-data-[open]:opacity-100 group-data-[popup-open]:opacity-100" />
        ) : null}
      </span>
    </button>
  );
});
