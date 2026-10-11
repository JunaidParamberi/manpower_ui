"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { TARGET_COUNTRIES as COUNTRIES } from "@/lib/data/target-countries";
import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  id?: string;
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
};

export function CountryCombobox({
  id,
  value,
  onChange,
  disabled,
  "aria-invalid": ariaInvalid,
}: Props) {
  const [open, setOpen] = React.useState(false);

  const normalized = value.trim().toUpperCase();
  const selected = COUNTRIES.find((c) => c.code === normalized);
  const label = selected ? `${selected.name} (${selected.code})` : "Select country";

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
          "h-auto min-h-11 w-full justify-between px-2.5 py-2 font-normal",
          !selected && "text-muted-foreground",
          ariaInvalid && "border-destructive",
        )}
      >
        <span className="truncate text-start">{label}</span>
        <ChevronsUpDownIcon className="ms-2 size-4 shrink-0 opacity-50" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[min(380px,70vh)] w-[min(calc(100vw-2rem),24rem)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search country or code…" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="clear selection empty none"
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-muted-foreground"
              >
                Clear selection
              </CommandItem>
              {COUNTRIES.map(({ code, name }) => (
                <CommandItem
                  key={code}
                  value={`${name} ${code}`}
                  onSelect={() => {
                    onChange(code);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "size-4 shrink-0",
                      normalized === code ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                  <span className="flex-1 truncate">{name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {code}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
