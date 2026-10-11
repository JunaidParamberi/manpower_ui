"use client";

import { cn } from "@/lib/utils";

/** A short text value that reads as text in the rail and edits in place. Use for reference numbers. */
export function RailText({
  id, label, value, onChange, placeholder, disabled, warn,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-2.5 rounded-[var(--item-radius)] py-1 pr-1.5 pl-2 text-[13px] hover:bg-[var(--bg-subtle)]">
      <label htmlFor={id} className="shrink-0 text-[var(--fg-2)]">{label}</label>
      <input
        id={id}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "min-w-0 flex-1 rounded-md border-0 bg-transparent py-0.5 pr-1 pl-1.5 text-right font-medium outline-none placeholder:font-normal placeholder:text-[var(--fg-3)]",
          "focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-ring)] disabled:text-[var(--fg)]",
          warn && "text-[var(--warning)]",
        )}
      />
    </div>
  );
}
