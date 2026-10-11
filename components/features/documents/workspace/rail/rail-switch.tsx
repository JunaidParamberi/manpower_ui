"use client";

import { useId } from "react";
import { Switch } from "@/components/ui/switch";

export function RailSwitch({
  label, checked, onCheckedChange, disabled,
}: { label: string; checked: boolean; onCheckedChange: (next: boolean) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="flex min-h-9 cursor-pointer items-center justify-between gap-2.5 rounded-[var(--item-radius)] py-1 pr-1.5 pl-2 text-[13px] hover:bg-[var(--bg-subtle)] has-[:disabled]:cursor-default"
    >
      <span className="text-[var(--fg-2)]">{label}</span>
      <Switch id={id} checked={checked} onCheckedChange={(v: boolean) => onCheckedChange(v)} disabled={disabled} />
    </label>
  );
}
