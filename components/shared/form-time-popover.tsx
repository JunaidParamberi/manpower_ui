"use client";

import * as React from "react";
import { Clock } from "lucide-react";

import {
  formatHhmmAs12hClock,
  hhmmFrom12Parts,
  parseHhmmTo12Parts,
  type Time12Parts,
} from "@/lib/utils/time-hhmm-12h";
import { cn } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type FormTimePopoverProps = {
  id?: string;
  /** `HH:mm` (24h) or empty */
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
};

function digitsOnlyMaxLen(s: string, maxLen: number): string {
  return s.replace(/\D/g, "").slice(0, maxLen);
}

export function FormTimePopover({
  id,
  value,
  onChange,
  placeholder = "Select time",
  disabled,
  className,
  "aria-invalid": ariaInvalid,
}: FormTimePopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [hourDraft, setHourDraft] = React.useState("");
  const [minuteDraft, setMinuteDraft] = React.useState("");
  const [period, setPeriod] = React.useState<"am" | "pm">("am");

  const syncDraftFromValue = React.useCallback((v: string) => {
    const p = parseHhmmTo12Parts(v);
    if (p) {
      setHourDraft(String(p.hour12));
      setMinuteDraft(p.minute);
      setPeriod(p.period);
    } else {
      setHourDraft("");
      setMinuteDraft("");
      setPeriod("am");
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      syncDraftFromValue(value);
    }
  }, [open, value, syncDraftFromValue]);

  const emitComplete = React.useCallback(
    (
      hStr: string,
      mStr: string,
      ap: "am" | "pm",
      emptyMeansClear: boolean,
    ) => {
      const ht = hStr.trim();
      const mt = mStr.trim();
      if (ht === "" && mt === "") {
        if (emptyMeansClear) {
          onChange("");
        }
        return true;
      }
      const h12 = Number.parseInt(ht, 10);
      const mi = Number.parseInt(mt, 10);
      if (
        ht !== "" &&
        mt !== "" &&
        !Number.isNaN(h12) &&
        !Number.isNaN(mi) &&
        h12 >= 1 &&
        h12 <= 12 &&
        mi >= 0 &&
        mi <= 59
      ) {
        const next: Time12Parts = {
          hour12: h12,
          minute: String(mi).padStart(2, "0"),
          period: ap,
        };
        onChange(hhmmFrom12Parts(next));
        return true;
      }
      return false;
    },
    [onChange],
  );

  /** Reset drafts only when there is a committed value (never wipe partial entry using empty `value`). */
  const revertToCommittedValue = React.useCallback(() => {
    if (value.trim()) {
      syncDraftFromValue(value);
    }
  }, [syncDraftFromValue, value]);

  const handleOpenChange = (next: boolean) => {
    if (!next && open) {
      const ht = hourDraft.trim();
      const mt = minuteDraft.trim();
      if (ht !== "" && mt !== "") {
        const ok = emitComplete(hourDraft, minuteDraft, period, false);
        if (!ok) {
          revertToCommittedValue();
        }
      } else if (ht === "" && mt === "") {
        emitComplete(hourDraft, minuteDraft, period, true);
      } else {
        revertToCommittedValue();
      }
    }
    setOpen(next);
  };

  const display = formatHhmmAs12hClock(value);
  const hasValue = Boolean(value.trim());

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
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
          className,
        )}
      >
        <Clock className="size-4 shrink-0 opacity-60" aria-hidden />
        <span className="truncate text-start tabular-nums">
          {hasValue ? display : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto min-w-[16rem] p-3"
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              aria-label="Hour"
              disabled={disabled}
              value={hourDraft}
              onChange={(e) => {
                const next = digitsOnlyMaxLen(e.target.value, 2);
                setHourDraft(next);
              }}
              onBlur={() => {
                const t = hourDraft.trim();
                if (t === "") {
                  if (minuteDraft.trim() === "") {
                    onChange("");
                  } else if (value.trim()) {
                    revertToCommittedValue();
                  }
                  return;
                }
                const n = Number.parseInt(t, 10);
                if (Number.isNaN(n)) {
                  if (value.trim()) {
                    revertToCommittedValue();
                  } else {
                    setHourDraft("");
                  }
                  return;
                }
                const h12 = Math.min(12, Math.max(1, n));
                setHourDraft(String(h12));
                const mt = minuteDraft.trim();
                const mi = mt === "" ? NaN : Number.parseInt(mt, 10);
                if (mt === "" || Number.isNaN(mi)) {
                  return;
                }
                const mm = String(Math.min(59, Math.max(0, mi))).padStart(
                  2,
                  "0",
                );
                setMinuteDraft(mm);
                const ok = emitComplete(String(h12), mm, period, false);
                if (!ok) {
                  revertToCommittedValue();
                }
              }}
              className="h-9 w-14 text-center tabular-nums"
              placeholder="12"
            />
            <span className="text-muted-foreground tabular-nums" aria-hidden>
              :
            </span>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              aria-label="Minute"
              disabled={disabled}
              value={minuteDraft}
              onChange={(e) => {
                const next = digitsOnlyMaxLen(e.target.value, 2);
                setMinuteDraft(next);
              }}
              onBlur={() => {
                const t = minuteDraft.trim();
                if (t === "") {
                  if (hourDraft.trim() === "") {
                    onChange("");
                  } else if (value.trim()) {
                    revertToCommittedValue();
                  }
                  return;
                }
                const n = Number.parseInt(t, 10);
                if (Number.isNaN(n)) {
                  if (value.trim()) {
                    revertToCommittedValue();
                  } else {
                    setMinuteDraft("");
                  }
                  return;
                }
                const mi = Math.min(59, Math.max(0, n));
                const mm = String(mi).padStart(2, "0");
                setMinuteDraft(mm);
                const ht = hourDraft.trim();
                const h12 = ht === "" ? NaN : Number.parseInt(ht, 10);
                if (ht === "" || Number.isNaN(h12)) {
                  return;
                }
                const hClamped = Math.min(12, Math.max(1, h12));
                setHourDraft(String(hClamped));
                const ok = emitComplete(String(hClamped), mm, period, false);
                if (!ok) {
                  revertToCommittedValue();
                }
              }}
              className="h-9 w-14 text-center tabular-nums"
              placeholder="00"
            />
            <div
              className="flex shrink-0 rounded-md border border-border p-0.5"
              role="group"
              aria-label="AM or PM"
            >
              <button
                type="button"
                disabled={disabled}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  period === "am"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => {
                  setPeriod("am");
                  emitComplete(hourDraft, minuteDraft, "am", false);
                }}
              >
                AM
              </button>
              <button
                type="button"
                disabled={disabled}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  period === "pm"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => {
                  setPeriod("pm");
                  emitComplete(hourDraft, minuteDraft, "pm", false);
                }}
              >
                PM
              </button>
            </div>
          </div>
          {hasValue ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full text-muted-foreground"
              disabled={disabled}
              onClick={() => {
                onChange("");
                setHourDraft("");
                setMinuteDraft("");
                setPeriod("am");
              }}
            >
              Clear time
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
