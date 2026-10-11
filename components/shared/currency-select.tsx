"use client";

import { cn } from "@/lib/utils";
import {
  formatCurrencySelectLabel,
  SUPPORTED_CURRENCIES,
} from "@/lib/data/currencies";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export const CLIENT_CURRENCY_INHERIT = "__profile_default__";

type CurrencySelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  allowInherit?: boolean;
  inheritLabel?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
};

export function CurrencySelect({
  id,
  value,
  onChange,
  allowInherit = false,
  inheritLabel = "Use profile default",
  disabled,
  invalid,
  className,
}: CurrencySelectProps) {
  const currentValue = allowInherit && !value ? CLIENT_CURRENCY_INHERIT : value;
  const selectedLabel =
    allowInherit && currentValue === CLIENT_CURRENCY_INHERIT
      ? inheritLabel
      : formatCurrencySelectLabel(currentValue);

  return (
    <Select
      value={currentValue}
      disabled={disabled}
      onValueChange={(next) => {
        if (!next) {
          return;
        }
        onChange(next === CLIENT_CURRENCY_INHERIT ? "" : next);
      }}
    >
      <SelectTrigger
        id={id}
        className={cn("w-full min-w-0", className)}
        aria-invalid={invalid || undefined}
      >
        <span className="truncate text-start">{selectedLabel}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {allowInherit ? (
            <SelectItem value={CLIENT_CURRENCY_INHERIT}>{inheritLabel}</SelectItem>
          ) : null}
          {SUPPORTED_CURRENCIES.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.code} - {currency.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
