"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A clickable region on the paper (client block, dates) that opens a picker. Static when read-only. */
export const PaperField = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { readOnly?: boolean; warn?: boolean; children: ReactNode }
>(function PaperField({ readOnly, warn, className, children, ...rest }, ref) {
  if (readOnly) return <div className={className}>{children}</div>;
  return (
    <button
      ref={ref}
      className={cn(
        "-m-1 block rounded-[5px] p-1 text-left outline-1 outline-offset-[3px] outline-dashed outline-transparent transition-[outline-color]",
        "hover:outline-[var(--sheet-line-strong)] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-[var(--sheet-accent)]",
        "data-[popup-open]:outline-2 data-[popup-open]:outline-solid data-[popup-open]:outline-[var(--sheet-accent)]",
        warn && "text-[var(--warning)]",
        className,
      )}
      {...rest}
      type="button"
    >
      {children}
    </button>
  );
});
