"use client";

import * as React from "react";

import { clampMinute } from "@/lib/utils/time-hhmm-12h";
import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

/** Stable sentinel so Select stays controlled (never `undefined`). */
const UNSET = "__unset__";

const HOURS_24 = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0"),
);

const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1));

const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);

export type FormTimeSelectProps = {
  id?: string;
  /** `HH:mm` (24h) or empty */
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  hourPlaceholder?: string;
  minutePlaceholder?: string;
  className?: string;
  /** `24h` — 00–23 + minutes. `12h` — 1–12 + minutes + AM/PM. */
  variant?: "24h" | "12h";
};

function parseHm24(value: string): {
  hour: string | null;
  minute: string | null;
} {
  const t = value.trim();
  if (!t) {
    return { hour: null, minute: null };
  }
  const [a, b] = t.split(":");
  if (a === undefined || b === undefined) {
    return { hour: null, minute: null };
  }
  const hNum = Number.parseInt(a.padStart(2, "0").slice(0, 2), 10);
  if (Number.isNaN(hNum)) {
    return { hour: null, minute: null };
  }
  const hourSafe = String(Math.min(23, Math.max(0, hNum))).padStart(2, "0");
  return {
    hour: hourSafe,
    minute: clampMinute(b),
  };
}

function from24hTo12Parts(hhmm: string): {
  hour12: string | null;
  minute: string | null;
  period: "am" | "pm" | null;
} {
  const t = hhmm.trim();
  if (!t) {
    return { hour12: null, minute: null, period: null };
  }
  const [a, b] = t.split(":");
  if (a === undefined || b === undefined) {
    return { hour12: null, minute: null, period: null };
  }
  const h24 = Number.parseInt(a.padStart(2, "0").slice(0, 2), 10);
  if (Number.isNaN(h24)) {
    return { hour12: null, minute: null, period: null };
  }
  const period: "am" | "pm" = h24 >= 12 ? "pm" : "am";
  let h12 = h24 % 12;
  if (h12 === 0) {
    h12 = 12;
  }
  return {
    hour12: String(h12),
    minute: clampMinute(b),
    period,
  };
}

function to24hFrom12(
  hour12: string,
  minute: string,
  period: "am" | "pm",
): string {
  let h = Number.parseInt(hour12, 10);
  if (Number.isNaN(h) || h < 1 || h > 12) {
    h = 12;
  }
  let h24: number;
  if (period === "am") {
    h24 = h === 12 ? 0 : h;
  } else {
    h24 = h === 12 ? 12 : h + 12;
  }
  return `${String(h24).padStart(2, "0")}:${minute}`;
}

function mergeHm(hour: string, minute: string): string {
  return `${hour}:${minute}`;
}

type SubProps = Omit<FormTimeSelectProps, "variant">;

function FormTimeSelect24h({
  id,
  value,
  onChange,
  disabled,
  hourPlaceholder = "Hour",
  minutePlaceholder = "Min",
  className,
}: SubProps) {
  const parsed24 = React.useMemo(() => parseHm24(value), [value]);

  const hourVal = parsed24.hour ?? UNSET;
  const minVal = parsed24.minute ?? UNSET;

  function setHour(hour: string) {
    if (hour === UNSET) {
      onChange("");
      return;
    }
    const m = parsed24.minute ?? "00";
    onChange(mergeHm(hour, m));
  }

  function setMinute(minute: string) {
    if (minute === UNSET) {
      onChange("");
      return;
    }
    const h = parsed24.hour ?? "00";
    onChange(mergeHm(h, minute));
  }

  return (
    <div
      id={id}
      className={cn("flex flex-wrap items-end gap-2", className)}
      data-slot="form-time-select"
      data-variant="24h"
    >
      <Select
        disabled={disabled}
        value={hourVal}
        onValueChange={(v) => setHour(v ?? "00")}
      >
        <SelectTrigger
          aria-label={hourPlaceholder}
          className="h-9 w-full min-w-0 sm:w-[5.25rem]"
        >
          <span
            className={cn(
              "truncate tabular-nums",
              hourVal === UNSET && "text-muted-foreground",
            )}
          >
            {parsed24.hour ?? hourPlaceholder}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNSET}>{hourPlaceholder}</SelectItem>
          {HOURS_24.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        disabled={disabled}
        value={minVal}
        onValueChange={(v) => setMinute(v ?? "00")}
      >
        <SelectTrigger
          aria-label={minutePlaceholder}
          className="h-9 w-full min-w-0 sm:w-[5.25rem]"
        >
          <span
            className={cn(
              "truncate tabular-nums",
              minVal === UNSET && "text-muted-foreground",
            )}
          >
            {parsed24.minute ?? minutePlaceholder}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNSET}>{minutePlaceholder}</SelectItem>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FormTimeSelect12h({
  id,
  value,
  onChange,
  disabled,
  hourPlaceholder = "Hour",
  minutePlaceholder = "Min",
  className,
}: SubProps) {
  const parsed12 = React.useMemo(() => from24hTo12Parts(value), [value]);

  const hourVal = parsed12.hour12 ?? UNSET;
  const minVal = parsed12.minute ?? UNSET;
  const perVal = parsed12.period ?? UNSET;

  function emit12(next: {
    hour12: string | null;
    minute: string | null;
    period: "am" | "pm" | null;
  }) {
    if (
      next.hour12 === null ||
      next.minute === null ||
      next.period === null
    ) {
      onChange("");
      return;
    }
    onChange(to24hFrom12(next.hour12, next.minute, next.period));
  }

  return (
    <div
      id={id}
      className={cn("flex flex-wrap items-end gap-2", className)}
      data-slot="form-time-select"
      data-variant="12h"
    >
      <Select
        disabled={disabled}
        value={hourVal}
        onValueChange={(v) => {
          if (v === UNSET) {
            emit12({
              hour12: null,
              minute: null,
              period: null,
            });
            return;
          }
          emit12({
            hour12: v,
            minute: parsed12.minute ?? "00",
            period: parsed12.period ?? "am",
          });
        }}
      >
        <SelectTrigger
          aria-label={hourPlaceholder}
          className="h-9 w-full min-w-0 sm:w-[4.5rem]"
        >
          <span
            className={cn(
              "truncate tabular-nums",
              hourVal === UNSET && "text-muted-foreground",
            )}
          >
            {parsed12.hour12 ?? hourPlaceholder}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNSET}>{hourPlaceholder}</SelectItem>
          {HOURS_12.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        disabled={disabled}
        value={minVal}
        onValueChange={(v) => {
          if (v === UNSET) {
            emit12({
              hour12: null,
              minute: null,
              period: null,
            });
            return;
          }
          emit12({
            hour12: parsed12.hour12 ?? "12",
            minute: v,
            period: parsed12.period ?? "am",
          });
        }}
      >
        <SelectTrigger
          aria-label={minutePlaceholder}
          className="h-9 w-full min-w-0 sm:w-[5.25rem]"
        >
          <span
            className={cn(
              "truncate tabular-nums",
              minVal === UNSET && "text-muted-foreground",
            )}
          >
            {parsed12.minute !== null ? parsed12.minute : minutePlaceholder}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNSET}>{minutePlaceholder}</SelectItem>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        disabled={disabled}
        value={perVal}
        onValueChange={(v) => {
          if (v === UNSET) {
            emit12({
              hour12: null,
              minute: null,
              period: null,
            });
            return;
          }
          const p = v === "pm" ? "pm" : "am";
          emit12({
            hour12: parsed12.hour12 ?? "12",
            minute: parsed12.minute ?? "00",
            period: p,
          });
        }}
      >
        <SelectTrigger
          aria-label="AM or PM"
          className="h-9 w-full min-w-0 sm:w-[5.5rem]"
        >
          <span
            className={cn(
              "truncate",
              perVal === UNSET && "text-muted-foreground",
            )}
          >
            {parsed12.period === "am"
              ? "AM"
              : parsed12.period === "pm"
                ? "PM"
                : "AM/PM"}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNSET}>AM / PM</SelectItem>
          <SelectItem value="am">AM</SelectItem>
          <SelectItem value="pm">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Theme-aligned time control. Values round-trip as `HH:mm` (24h) for `combineLocalDateAndTime`.
 */
export function FormTimeSelect({
  variant = "24h",
  ...props
}: FormTimeSelectProps) {
  if (variant === "12h") {
    return <FormTimeSelect12h {...props} />;
  }
  return <FormTimeSelect24h {...props} />;
}
