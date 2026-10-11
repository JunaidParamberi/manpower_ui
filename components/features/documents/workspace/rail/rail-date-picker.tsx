"use client";

import { useState, type ReactElement } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { addDaysIso, termsLabel } from "@/lib/documents/draft-defaults";
import { monthGrid, relativeDays, TERM_CHOICES } from "@/lib/documents/editor/calendar-grid";

const fmtLong = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const viewOf = (iso: string) => ({ y: Number(iso.slice(0, 4)), m: Number(iso.slice(5, 7)) - 1 });

/** Term chips (due dates) plus a Monday-first month calendar. All dates are ISO `YYYY-MM-DD`. */
export function RailDatePicker({
  trigger, value, onChange, today, referenceDate, withTerms = false, clearable = false, side = "left",
}: {
  trigger: ReactElement;
  value: string | null;
  onChange: (iso: string | null, terms: string | null) => void;
  today: string;
  /** The issue date: outlined on the calendar and the base for payment terms. */
  referenceDate?: string;
  withTerms?: boolean;
  clearable?: boolean;
  side?: "left" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => viewOf(value ?? referenceDate ?? today));
  const days = monthGrid(view.y, view.m);
  const monthName = new Date(Date.UTC(view.y, view.m, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const shift = (d: number) =>
    setView((v) => {
      const n = new Date(Date.UTC(v.y, v.m + d, 1));
      return { y: n.getUTCFullYear(), m: n.getUTCMonth() };
    });
  const pick = (iso: string | null, terms: string | null) => {
    onChange(iso, terms);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o: boolean) => {
        setOpen(o);
        if (o) setView(viewOf(value ?? referenceDate ?? today));
      }}
    >
      <PopoverTrigger render={trigger} />
      <PopoverContent side={side} align="start" sideOffset={8} className="w-[296px] gap-0 overflow-hidden p-0">
        {withTerms && referenceDate ? (
          <>
            <p className="px-2.5 pt-2 pb-1 text-[11px] font-medium text-[var(--fg-3)]">Payment terms</p>
            <div className="flex flex-wrap gap-1 px-2.5 pb-1">
              {TERM_CHOICES.map((d) => {
                const iso = addDaysIso(referenceDate, d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={iso === value}
                    onClick={() => pick(iso, termsLabel(d))}
                    className="h-[26px] rounded-full border border-border bg-[var(--bg-surface)] px-2.5 text-[12px] text-[var(--fg-2)] hover:border-[var(--border-strong)] hover:text-[var(--fg)] aria-pressed:border-[var(--fg)] aria-pressed:bg-[var(--fg)] aria-pressed:text-[var(--bg-surface)]"
                  >
                    {termsLabel(d)}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
        <div className="px-2.5 pt-1.5 pb-2.5">
          <div className="flex items-center justify-between px-0.5 pt-1 pb-1.5 text-[13px] font-semibold">
            <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className="grid size-[26px] place-items-center rounded-[var(--item-radius)] text-[var(--fg-2)] hover:bg-[var(--bg-subtle)]">
              <ChevronLeft className="size-3.5" />
            </button>
            <span>{monthName}</span>
            <button type="button" aria-label="Next month" onClick={() => shift(1)} className="grid size-[26px] place-items-center rounded-[var(--item-radius)] text-[var(--fg-2)] hover:bg-[var(--bg-subtle)]">
              <ChevronRight className="size-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="py-1 text-[11px] font-medium text-[var(--fg-3)]">{d}</span>
            ))}
            {days.map((iso) => {
              const out = Number(iso.slice(5, 7)) - 1 !== view.m;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => pick(iso, null)}
                  aria-label={fmtLong(iso)}
                  aria-pressed={iso === value}
                  className={cn(
                    "relative h-8 rounded-[var(--item-radius)] text-[12px] tabular-nums hover:bg-[var(--bg-subtle)]",
                    out && "text-[var(--fg-3)]",
                    iso === referenceDate && iso !== value && "ring-1 ring-[var(--border-strong)] ring-inset",
                    iso === value && "bg-[var(--accent)] font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent)]",
                  )}
                >
                  {Number(iso.slice(8))}
                  {iso === today ? (
                    <span aria-hidden className={cn("absolute bottom-1 left-1/2 size-[3px] -translate-x-1/2 rounded-full", iso === value ? "bg-[var(--fg-on-accent)]" : "bg-[var(--accent)]")} />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-[var(--panel)] px-3 py-2 text-[12px] text-[var(--fg-2)]">
          <span>{value ? `${fmtLong(value)} · ${relativeDays(value, today)}` : "No date yet"}</span>
          {clearable && value ? (
            <button type="button" onClick={() => pick(null, null)} className="text-[var(--danger)]">Clear</button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
