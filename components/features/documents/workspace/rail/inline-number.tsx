"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronsLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseNumberInput, scrubValue, stepValue, type NumberBounds } from "@/lib/documents/editor/scrub";

type Unit = { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void };

/**
 * A number that reads as text. Click to type, ↑/↓ to step (Shift ×10), or drag
 * the label sideways to scrub.
 */
export function InlineNumber({
  id, label, value, onChange, bounds, suffix, unit, placeholder = "0", disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (next: number) => void;
  bounds: NumberBounds;
  suffix?: string;
  unit?: Unit;
  placeholder?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value ? String(value) : "");
  const [focused, setFocused] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  useEffect(() => {
    if (!focused) setDraft(value ? String(value) : "");
  }, [value, focused]);

  const clamp = (n: number) => Math.min(bounds.max, Math.max(bounds.min, n));

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const next = stepValue(parseNumberInput(draft) ?? 0, e.key === "ArrowUp" ? 1 : -1, bounds, e.shiftKey);
    setDraft(String(next));
    onChange(next);
  }

  function onLabelPointerDown(e: PointerEvent<HTMLSpanElement>) {
    if (disabled) return;
    const startX = e.clientX;
    const start = value;
    let moved = false;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: globalThis.PointerEvent) => {
      const dx = ev.clientX - startX;
      if (Math.abs(dx) > 2) {
        moved = true;
        setScrubbing(true);
      }
      if (moved) onChange(scrubValue(start, dx, bounds, ev.shiftKey));
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      setScrubbing(false);
      if (!moved) inputRef.current?.focus();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  }

  return (
    <div className={cn("group flex min-h-9 items-center justify-between gap-2.5 rounded-[var(--item-radius)] py-1 pr-1.5 pl-2 text-[13px] hover:bg-[var(--bg-subtle)]", scrubbing && "cursor-ew-resize select-none")}>
      <span
        onPointerDown={onLabelPointerDown}
        className={cn("flex items-center gap-1.5 text-[var(--fg-2)] select-none", !disabled && "cursor-ew-resize")}
      >
        <label htmlFor={id} className="cursor-[inherit]">{label}</label>
        {!disabled ? <ChevronsLeftRight aria-hidden className="size-[11px] text-[var(--fg-3)] opacity-0 transition-opacity group-hover:opacity-100" /> : null}
      </span>
      <span className="inline-flex items-baseline gap-px rounded-md py-0.5 pr-1 pl-1.5 font-medium focus-within:bg-[var(--bg-surface)] focus-within:ring-1 focus-within:ring-[var(--accent)] focus-within:shadow-[0_0_0_4px_var(--accent-ring)]">
        <input
          ref={inputRef}
          id={id}
          inputMode="decimal"
          disabled={disabled}
          value={draft}
          placeholder={placeholder}
          size={Math.max(2, (draft || placeholder).length + 1)}
          onFocus={(e) => {
            setFocused(true);
            e.currentTarget.select();
          }}
          onBlur={() => {
            setFocused(false);
            const n = parseNumberInput(draft);
            onChange(n === null ? 0 : clamp(n));
          }}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = parseNumberInput(e.target.value);
            if (n !== null) onChange(clamp(n));
          }}
          onKeyDown={onKeyDown}
          className="w-auto border-0 bg-transparent p-0 text-right tabular-nums outline-none disabled:text-[var(--fg)]"
        />
        {suffix ? <span className="font-normal text-[var(--fg-3)]">{suffix}</span> : null}
        {unit ? (
          <span role="group" aria-label={`${label} unit`} className="ml-1.5 inline-flex gap-0.5 rounded-full bg-[var(--bg-subtle)] p-0.5">
            {unit.options.map((o) => (
              <button
                key={o.value}
                type="button"
                disabled={disabled}
                aria-pressed={unit.value === o.value}
                onClick={() => unit.onChange(o.value)}
                className="h-[18px] rounded-full px-1.5 text-[11px] text-[var(--fg-3)] aria-pressed:bg-[var(--bg-surface)] aria-pressed:text-[var(--fg)] aria-pressed:shadow-[var(--shadow-sm)]"
              >
                {o.label}
              </button>
            ))}
          </span>
        ) : null}
      </span>
    </div>
  );
}
