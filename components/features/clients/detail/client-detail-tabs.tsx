"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { CLIENT_TABS, type ClientTab } from "@/lib/clients/client-tab";
import { cn } from "@/lib/utils";

const LABELS: Record<ClientTab, string> = {
  overview: "Overview",
  projects: "Projects",
  documents: "Documents",
  activity: "Activity",
  about: "About",
};

/** Underline tabs for the client detail, styled like the project workspace tabs. The selected tab lives in ?tab=. */
export function ClientDetailTabs({
  tab,
  counts,
}: {
  tab: ClientTab;
  counts: Partial<Record<ClientTab, number>>;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(id: ClientTab): string {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "overview") params.delete("tab");
    else params.set("tab", id);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="shrink-0 px-4 shadow-[inset_0_-1px_0_var(--border)] sm:px-6 lg:px-7">
      <nav
        aria-label="Client sections"
        className="scroll-x flex min-w-0 gap-0.5 [&>a:first-child]:ps-0 [&>a:first-child]:after:start-0"
      >
        {CLIENT_TABS.map((id) => {
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
