"use client";

import { Braces } from "lucide-react";
import { useMemo } from "react";

import {
  VARIABLE_CATALOG,
  type VariableDescriptor,
} from "@/lib/documents/variables";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type VariableMenuProps = {
  onInsert: (key: string) => void;
};

export function VariableMenu({ onInsert }: VariableMenuProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, VariableDescriptor[]>();
    for (const v of VARIABLE_CATALOG) {
      const list = map.get(v.group) ?? [];
      list.push(v);
      map.set(v.group, list);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <Braces className="size-3.5" />
            Insert variable
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        {grouped.map(([group, vars], i) => (
          <DropdownMenuGroup key={group}>
            {i > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground/80">
              {group}
            </DropdownMenuLabel>
            {vars.map((v) => (
              <DropdownMenuItem
                key={v.key}
                onClick={() => onInsert(v.key)}
                className="flex items-center justify-between gap-3"
              >
                <span>{v.label}</span>
                <span className="font-mono text-[0.7rem] text-muted-foreground">
                  {`{{${v.key}}}`}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
