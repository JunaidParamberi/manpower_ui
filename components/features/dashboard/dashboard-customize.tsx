"use client";

import { createContext, useContext } from "react";
import { LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";

export type DashboardCustomizeValue = { editing: boolean; toggle: () => void };

/** Provided by DashboardLanes so the queue header can host the Customize control. */
export const DashboardCustomizeContext = createContext<DashboardCustomizeValue | null>(null);

/**
 * `inline` sits in the queue header and steps aside while editing: in edit mode
 * each card gets a hide toggle in its top-right corner, which would cover it.
 * DashboardLanes then shows the `toolbar` copy above the cards instead.
 */
export function DashboardCustomizeButton({ placement = "toolbar" }: { placement?: "inline" | "toolbar" }) {
  const ctx = useContext(DashboardCustomizeContext);
  if (!ctx) return null;
  if (placement === "inline" && ctx.editing) return null;
  return (
    <Button size="sm" variant={ctx.editing ? "default" : "ghost"} onClick={ctx.toggle}>
      <LayoutGrid data-icon="inline-start" size={14} />
      {ctx.editing ? "Done" : "Customize"}
    </Button>
  );
}
