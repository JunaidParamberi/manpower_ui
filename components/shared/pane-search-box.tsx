"use client";

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type PaneSearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
};

/** 32px search field for list panes. "/" focuses it, Esc clears it. */
export function PaneSearchBox({ value, onChange, placeholder, ariaLabel, className }: PaneSearchBoxProps) {
  const ref = useRef<HTMLInputElement>(null);

  // "/" jumps to the search box (unless you're already typing somewhere).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      e.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className={cn(
        "flex h-8 min-w-0 items-center gap-2 rounded-md border border-transparent bg-[var(--bg-subtle)] px-2.5 text-[var(--fg-3)] transition-colors focus-within:border-[var(--border-strong)] focus-within:bg-card",
        className,
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            onChange("");
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="min-w-0 flex-1 border-0 bg-transparent text-body text-foreground outline-none placeholder:text-[var(--fg-3)] [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="grid size-5 shrink-0 place-items-center rounded-full border-0 bg-transparent p-0 text-[var(--fg-3)] hover:bg-[var(--bg-subtle)] hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        <kbd className="shrink-0 rounded border border-border px-1.5 text-label leading-4 text-[var(--fg-3)]">/</kbd>
      )}
    </div>
  );
}
