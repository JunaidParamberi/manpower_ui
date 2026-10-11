"use client";

import { useState, type KeyboardEvent, type ReactElement, type ReactNode } from "react";
import { Check, Plus, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { filterOptions, moveHighlight } from "@/lib/documents/editor/picker-filter";

export type PickerOption = {
  value: string;
  label: string;
  secondary?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  keywords?: string;
};

/** Searchable list in a popover, in the command-palette style. ↑↓ moves, Enter picks, Esc closes. */
export function RailPicker({
  trigger, placeholder, options, value, onPick, footerAction, emptyText, side = "left",
}: {
  trigger: ReactElement;
  placeholder: string;
  options: PickerOption[];
  value: string | null;
  onPick: (value: string) => void;
  footerAction?: { label: (query: string) => string; onSelect: (query: string) => void };
  emptyText?: (query: string) => string;
  side?: "left" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hi, setHi] = useState(0);
  const list = filterOptions(options, query);
  const count = list.length + (footerAction ? 1 : 0);

  function choose(index: number) {
    if (index < list.length) {
      onPick(list[index].value);
      setOpen(false);
    } else if (footerAction) {
      footerAction.onSelect(query);
      setOpen(false);
    }
  }
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((i) => moveHighlight(i, count, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((i) => moveHighlight(i, count, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(hi);
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o: boolean) => {
        setOpen(o);
        if (o) {
          setQuery("");
          setHi(0);
        }
      }}
    >
      <PopoverTrigger render={trigger} />
      <PopoverContent side={side} align="start" sideOffset={8} className="w-[300px] gap-0 overflow-hidden p-0">
        <div className="flex h-[42px] items-center gap-2 border-b border-border px-3">
          <Search aria-hidden className="size-3.5 text-[var(--fg-3)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHi(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-full flex-1 border-0 bg-transparent text-[13px] outline-none placeholder:text-[var(--fg-3)]"
          />
        </div>
        <div role="listbox" className="max-h-[280px] overflow-auto p-1.5">
          {list.length === 0 ? (
            <p className="px-2.5 py-3.5 text-center text-[12px] text-[var(--fg-3)]">
              {emptyText ? emptyText(query) : `Nothing matches "${query}"`}
            </p>
          ) : null}
          {list.map((o, i) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onMouseMove={() => setHi(i)}
              onClick={() => choose(i)}
              className={cn("flex cursor-pointer items-center gap-2.5 rounded-[var(--item-radius)] px-2 py-1.5 text-[13px]", i === hi && "bg-[var(--bg-subtle)]")}
            >
              {o.leading}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{o.label}</span>
                {o.secondary ? <span className="truncate text-[11px] text-[var(--fg-3)]">{o.secondary}</span> : null}
              </span>
              {o.trailing}
              {o.value === value ? <Check aria-hidden className="size-3.5 text-[var(--accent)]" /> : null}
            </div>
          ))}
          {footerAction ? (
            <div
              role="option"
              aria-selected={false}
              onMouseMove={() => setHi(list.length)}
              onClick={() => choose(list.length)}
              className={cn("flex cursor-pointer items-center gap-2.5 rounded-[var(--item-radius)] px-2 py-1.5 text-[13px] font-medium text-[var(--accent)]", hi === list.length && "bg-[var(--bg-subtle)]")}
            >
              <span className="grid size-5 place-items-center rounded-md border border-dashed border-current"><Plus className="size-3" /></span>
              {footerAction.label(query)}
            </div>
          ) : null}
        </div>
        <div className="flex gap-3 border-t border-border bg-[var(--panel)] px-3 py-2 text-[11px] text-[var(--fg-3)]">
          <span>↑ ↓ move</span>
          <span>Enter pick</span>
          <span>Esc close</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
