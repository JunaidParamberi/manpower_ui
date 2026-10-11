import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The app shell's page-title spec, in one place.
 *
 * Exported because two surfaces cannot use `PageHeader` itself — the client
 * detail header carries an avatar and status chips, and the settings shell
 * renders its title inside a tab strip — but they must still render the same
 * heading. Anything else should use the component rather than this string.
 */
export const PAGE_TITLE_CLASS =
  "font-heading text-[22px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Renders a back link above the title. `backLabel` names the destination. */
  backHref?: string;
  backLabel?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  backHref,
  backLabel,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between reveal",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        {backHref ? (
          <Link
            href={backHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ms-2 mb-0.5 w-fit gap-2 px-2",
            )}
          >
            <ArrowLeft />
            {backLabel ?? "Back"}
          </Link>
        ) : null}
        {eyebrow ? (
          <p className="text-label font-medium uppercase tracking-[0.06em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className={PAGE_TITLE_CLASS}>{title}</h1>
        {description ? (
          <p className="max-w-2xl text-[13px] text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
