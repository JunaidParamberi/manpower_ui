import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const SECTION_LINK = "text-meta font-medium text-primary hover:underline";

/** A titled block of flush rows on the client detail. No card: a heading and hairline rows. */
export function ClientSection({
  title,
  count,
  action,
  children,
  className,
}: {
  title: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 px-4 pt-5 sm:px-6 lg:px-7", className)}>
      <header className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-card-title">
          {title}
          {count !== undefined ? <span className="ms-1.5 font-normal tabular-nums text-[var(--fg-3)]">{count}</span> : null}
        </h3>
        {action}
      </header>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

export function ClientSectionEmpty({ children }: { children: ReactNode }) {
  return <p className="py-2.5 text-body text-[var(--fg-3)]">{children}</p>;
}
