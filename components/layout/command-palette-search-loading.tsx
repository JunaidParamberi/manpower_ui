"use client";

import { ProgressIndeterminate } from "@/components/shared/loaders";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SkeletonRowProps = {
  withBadge?: boolean;
  titleWidth: string;
  subtitleWidth: string;
  delayMs: number;
};

function SearchSkeletonRow({
  withBadge = false,
  titleWidth,
  subtitleWidth,
  delayMs,
}: SkeletonRowProps) {
  return (
    <div
      className="mx-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <Skeleton className="size-[26px] shrink-0 rounded-[7px]" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className={cn("h-3.5 rounded-sm", titleWidth)} />
        <Skeleton className={cn("h-2.5 rounded-sm", subtitleWidth)} />
      </div>
      {withBadge ? (
        <Skeleton className="h-4 w-10 shrink-0 rounded-full" />
      ) : null}
    </div>
  );
}

const SEARCH_SKELETON_ROWS: Omit<SkeletonRowProps, "delayMs">[] = [
  { titleWidth: "w-[42%]", subtitleWidth: "w-[28%]" },
  { titleWidth: "w-[54%]", subtitleWidth: "w-[36%]" },
  { titleWidth: "w-[38%]", subtitleWidth: "w-[48%]", withBadge: true },
  { titleWidth: "w-[46%]", subtitleWidth: "w-[32%]" },
];

export function CommandPaletteSearchLoading() {
  return (
    <div
      role="status"
      aria-label="Searching"
      aria-live="polite"
      className="overflow-hidden"
    >
      <ProgressIndeterminate className="h-[2px] w-full" />
      <p className="px-3 pt-3 pb-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--fg-3)]">
        Results
      </p>
      <div className="pb-2">
        {SEARCH_SKELETON_ROWS.map((row, index) => (
          <SearchSkeletonRow key={index} {...row} delayMs={index * 70} />
        ))}
      </div>
    </div>
  );
}
