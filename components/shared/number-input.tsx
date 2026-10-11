"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Hide the native spinner arrows across browsers. Firefox uses
// `appearance: textfield`; WebKit/Blink need the pseudo-elements zeroed out.
const HIDE_SPINNERS =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none";

export type NumberInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type"
> & {
  /** Allow a leading minus sign. Off by default; turn on for e.g. credit notes. */
  allowNegative?: boolean;
  /** Allow a decimal point. On by default; turn off for integer-only fields. */
  allowDecimal?: boolean;
};

/**
 * Number input with the native quirks removed: no spinner arrows, no
 * scroll-wheel value changes, no ↑/↓ increment, and no `e`/`+`/`-` unless
 * explicitly allowed. Visually identical to the base Input.
 */
export function NumberInput({
  className,
  allowNegative = false,
  allowDecimal = true,
  inputMode,
  onKeyDown,
  onWheel,
  ...props
}: NumberInputProps) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const blocked =
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "e" ||
      event.key === "E" ||
      event.key === "+" ||
      (!allowNegative && event.key === "-") ||
      (!allowDecimal && (event.key === "." || event.key === ","));

    if (blocked) {
      event.preventDefault();
    }

    onKeyDown?.(event);
  }

  function handleWheel(event: React.WheelEvent<HTMLInputElement>) {
    // A focused number input otherwise changes value on scroll. Blur so the
    // page scrolls instead of mutating the field.
    event.currentTarget.blur();
    onWheel?.(event);
  }

  return (
    <Input
      type="number"
      inputMode={inputMode ?? (allowDecimal ? "decimal" : "numeric")}
      className={cn(HIDE_SPINNERS, className)}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      {...props}
    />
  );
}
