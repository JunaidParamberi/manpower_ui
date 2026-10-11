"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { formatProjectDate } from "@/lib/projects/display";
import { cn } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** Parse `YYYY-MM-DD` from form state to local calendar date. */
export function parseFormDateString(iso: string): Date | undefined {
  const t = iso.trim();
  if (!t) {
    return undefined;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) {
    return undefined;
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
}

export function toFormDateString(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

type FormDatePickerProps = {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
};

/**
 * Single-date control: stores `YYYY-MM-DD` or `""`, opens shadcn Calendar in a Popover (no native `input[type=date]`).
 */
export function FormDatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  "aria-invalid": ariaInvalid,
}: FormDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseFormDateString(value);
  const hasValue = Boolean(value.trim());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-expanded={open}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-full min-w-0 justify-start gap-2 px-3 font-normal",
          !hasValue && "text-muted-foreground",
          ariaInvalid && "border-destructive",
        )}
      >
        <CalendarIcon className="size-4 shrink-0 opacity-60" aria-hidden />
        <span className="truncate text-start">
          {hasValue ? formatProjectDate(value) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto min-w-0 p-0"
        align="start"
        sideOffset={4}
      >
        <div data-slot="card-content" className="flex flex-col gap-2 p-0">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            defaultMonth={selected}
            selected={selected}
            onSelect={(d) => {
              onChange(d ? toFormDateString(d) : "");
              setOpen(false);
            }}
            disabled={disabled}
          />
          {hasValue ? (
            <div className="border-t border-border px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-full text-muted-foreground"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Clear date
              </Button>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
