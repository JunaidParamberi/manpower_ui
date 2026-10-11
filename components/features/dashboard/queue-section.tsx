// components/features/dashboard/queue-section.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { DashboardCustomizeButton } from "@/components/features/dashboard/dashboard-customize";
import { QueueCard } from "@/components/features/dashboard/queue-card";
import type { QueueItem } from "@/lib/dashboard/snapshot-types";

type QueueSectionProps = {
  items: QueueItem[];
  snoozedCount: number;
};

export function QueueSection({ items, snoozedCount }: QueueSectionProps) {
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const key = (item: QueueItem) => `${item.type}:${item.id}`;
  const visible = items.filter((item) => !removed.has(key(item)));

  function onRemoved(item: QueueItem) {
    setRemoved((prev) => new Set(prev).add(key(item)));
  }

  function onRestored(item: QueueItem) {
    setRemoved((prev) => {
      const next = new Set(prev);
      next.delete(key(item));
      return next;
    });
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-card-title text-foreground">
          Needs you
          {visible.length > 0 ? (
            <span className="inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--bg-subtle)] px-[5px] text-label font-medium tabular-nums text-[var(--fg-2)]">
              <span className="sr-only">, </span>
              {visible.length}
              <span className="sr-only"> {visible.length === 1 ? "item" : "items"}</span>
            </span>
          ) : null}
        </h2>
        <DashboardCustomizeButton placement="inline" />
      </div>

      {visible.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-xs)]">
          <CheckCircle2 size={16} strokeWidth={1.6} className="shrink-0 text-[var(--success)]" />
          <p className="text-body text-muted-foreground">
            Nothing needs you today. Money that lands or quotes that go quiet will show up here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((item) => (
            <QueueCard
              key={key(item)}
              item={item}
              onRemoved={onRemoved}
              onRestored={onRestored}
            />
          ))}
        </div>
      )}

      {snoozedCount > 0 ? (
        <Link
          href="/documents"
          className="self-start text-meta text-muted-foreground underline-offset-4 hover:underline"
        >
          {snoozedCount} snoozed
        </Link>
      ) : null}
    </section>
  );
}