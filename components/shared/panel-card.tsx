import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The refined card: 46px header bar, 16px sides, flush hairline rows.
 * Use instead of `components/ui/card` for app surfaces — its 24px padding is
 * what made pages feel chunky. See DESIGN_SYSTEM.md "Refined scale".
 */
export function PanelCard({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-[var(--shadow-xs)]",
        className,
      )}
      {...props}
    />
  );
}

type PanelCardHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Right slot: a count, a range toggle, an icon or a ghost button. */
  meta?: ReactNode;
  className?: string;
};

export function PanelCardHeader({ title, description, meta, className }: PanelCardHeaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[46px] flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border px-4 py-2.5",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="truncate text-card-title text-foreground">{title}</h2>
        {description ? <p className="text-meta text-[var(--fg-3)]">{description}</p> : null}
      </div>
      {meta ? (
        <div className="flex shrink-0 items-center gap-2 text-meta text-[var(--fg-3)]">{meta}</div>
      ) : null}
    </div>
  );
}

export function PanelCardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex min-w-0 flex-col gap-2 px-4 pt-3 pb-3.5", className)} {...props} />;
}

export function PanelCardList({ className, ...props }: ComponentProps<"ul">) {
  return <ul className={cn("m-0 flex min-w-0 list-none flex-col p-0 py-1", className)} {...props} />;
}

const ROW_CLASS = "flex min-w-0 items-center gap-2.5 px-4 py-2.5 text-body no-underline";

/**
 * A list item; with `href` the whole row is a link inside the `<li>` (a link
 * must keep its own role, so the item role never goes on the `<a>`).
 */
export function PanelCardRow({
  href,
  className,
  children,
}: {
  href?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <li className="min-w-0 border-t border-border first:border-t-0">
      {href ? (
        <Link href={href} className={cn(ROW_CLASS, "transition-colors hover:bg-[var(--bg-subtle)]", className)}>
          {children}
        </Link>
      ) : (
        <div className={cn(ROW_CLASS, className)}>{children}</div>
      )}
    </li>
  );
}

export function PanelCardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-wrap gap-6 border-t border-border px-4 py-3 text-meta", className)}
      {...props}
    />
  );
}
