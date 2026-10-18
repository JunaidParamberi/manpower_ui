"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { WORKER_TABS, type WorkerTab } from "@/lib/workers/worker-tab";
import { cn } from "@/lib/utils";

const LABELS: Record<WorkerTab, string> = {
  overview: "Overview",
  documents: "Documents",
  clients: "Clients",
  accommodation: "Accommodation",
  timesheets: "Timesheets",
  about: "About",
};

/** Underline tabs for the worker detail, styled like the project workspace tabs. The selected tab lives in ?tab=. */
export function WorkerDetailTabs({
  tab,
  counts,
}: {
  tab: WorkerTab;
  counts: Partial<Record<WorkerTab, number>>;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(id: WorkerTab): string {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "overview") params.delete("tab");
    else params.set("tab", id);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="shrink-0 px-4 shadow-[inset_0_-1px_0_var(--border)] sm:px-6 lg:px-7">
      <nav
        aria-label="Worker sections"
        className="scroll-x flex min-w-0 gap-0.5 [&>a:first-child]:ps-0 [&>a:first-child]:after:start-0"
      >
        {WORKER_TABS.map((id) => {
          const on = id === tab;
          const count = counts[id];
          return (
            <Link
              key={id}
              href={hrefFor(id)}
              replace
              scroll={false}
              aria-current={on ? "page" : undefined}
              className={cn(
                "relative inline-flex h-[38px] shrink-0 items-center px-2.5 text-body font-medium whitespace-nowrap",
                on
                  ? "text-foreground after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground"
                  : "text-[var(--fg-3)] hover:text-foreground",
              )}
            >
              {LABELS[id]}
              {count ? <span className="ms-1.5 text-label font-normal tabular-nums text-[var(--fg-3)]">{count}</span> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
