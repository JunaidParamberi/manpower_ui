// components/features/dashboard/dashboard-lanes.tsx
"use client";

import { useCallback, useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import {
  DashboardCustomizeButton,
  DashboardCustomizeContext,
} from "@/components/features/dashboard/dashboard-customize";
import { updateDashboardLayout } from "@/lib/dashboard/layout-actions";
import {
  DASHBOARD_CARD_LABELS,
  type DashboardCardId,
  type DashboardLayout,
} from "@/lib/dashboard/layout-registry";
import { cn } from "@/lib/utils";

type DashboardLanesProps = {
  layout: DashboardLayout;
  /** Fixed lane assignment — cards never move between lanes. */
  main: { id: DashboardCardId; node: React.ReactNode }[];
  rail: { id: DashboardCardId; node: React.ReactNode }[];
};

export function DashboardLanes({ layout, main, rail }: DashboardLanesProps) {
  const [hidden, setHidden] = useState<Set<DashboardCardId>>(new Set(layout.hidden));
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  const toggle = useCallback(
    (id: DashboardCardId) => {
      const next = new Set(hidden);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setHidden(next);
      startTransition(() => {
        void updateDashboardLayout(layout.order, Array.from(next)).then((result) => {
          if (!result.ok) toast.error("Couldn't save your dashboard layout — try again");
        });
      });
    },
    [hidden, layout.order],
  );

  function renderSlot({ id, node }: { id: DashboardCardId; node: React.ReactNode }) {
    const isHidden = hidden.has(id);
    if (isHidden && !editing) return null;

    return (
      <div key={id} className={cn("relative", isHidden && "opacity-40")}>
        {editing ? (
          <button
            type="button"
            onClick={() => toggle(id)}
            aria-label={`${isHidden ? "Show" : "Hide"} ${DASHBOARD_CARD_LABELS[id]}`}
            className="absolute -top-3 right-2 z-20 grid size-7 place-items-center rounded-md border border-border bg-[var(--bg-surface)] text-[var(--fg-3)] shadow-sm hover:text-foreground"
          >
            {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        ) : null}
        {node}
      </div>
    );
  }

  // The queue header hosts Customize. While editing (card hide toggles would
  // cover it) or when the queue is hidden, Done/Customize lives in a toolbar
  // above the cards so the user can always get out.
  const showFallbackToolbar = editing || hidden.has("queue");

  return (
    <DashboardCustomizeContext.Provider value={{ editing, toggle: () => setEditing((value) => !value) }}>
      <div className="flex flex-col gap-4">
        {showFallbackToolbar ? (
          <div className="flex justify-end">
            <DashboardCustomizeButton />
          </div>
        ) : null}

        <div className="grid gap-4 @5xl/shell:grid-cols-[1.6fr_1fr]">
          <div className="flex min-w-0 flex-col gap-4">{main.map(renderSlot)}</div>
          <div className="flex min-w-0 flex-col gap-4">{rail.map(renderSlot)}</div>
        </div>
      </div>
    </DashboardCustomizeContext.Provider>
  );
}