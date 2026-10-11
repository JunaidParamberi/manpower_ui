// components/features/dashboard/brief-card.tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { AiIcon } from "@/components/shared/ai-icon";
import { PanelCard, PanelCardBody, PanelCardHeader } from "@/components/shared/panel-card";
import type { BriefFacts, BriefLine } from "@/lib/dashboard/snapshot-types";
import { cn } from "@/lib/utils";

type BriefCardProps = { brief: BriefFacts };

const BAND_DOT: Record<BriefLine["band"], string> = {
  high: "bg-[var(--danger)]",
  medium: "bg-[var(--warning)]",
  low: "bg-[var(--fg-3)]",
};

function LineRow({ line }: { line: BriefLine }) {
  const content = (
    <>
      <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", BAND_DOT[line.band])} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium leading-snug text-foreground">{line.title}</p>
        <p className="mt-0.5 text-meta leading-relaxed text-muted-foreground">{line.detail}</p>
      </div>
      {line.href ? (
        <ChevronRight size={14} strokeWidth={1.6} className="mt-0.5 shrink-0 text-muted-foreground" />
      ) : null}
    </>
  );

  const className = "flex items-start gap-2.5 rounded-md border border-border px-2.5 py-2 no-underline";

  return line.href ? (
    <Link href={line.href} className={cn(className, "transition-colors hover:bg-[var(--bg-subtle)]")}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

/**
 * Narrated on plans the nightly agents scan, plain facts everywhere else. The
 * AI attribution appears only when there is a real narrative behind it.
 */
export function BriefCard({ brief }: BriefCardProps) {
  const hasContent = brief.narrative !== null || brief.lines.length > 0;

  return (
    <PanelCard>
      <PanelCardHeader title="Today's brief" meta={brief.narrative ? <AiIcon size={14} /> : null} />
      <PanelCardBody>
        {!hasContent ? <p className="text-body text-muted-foreground">Nothing to report today.</p> : null}

        {brief.narrative ? (
          <p className="text-body leading-relaxed text-[var(--fg-2)]">{brief.narrative}</p>
        ) : null}

        {brief.lines.map((line) => (
          <LineRow key={line.id} line={line} />
        ))}

        {brief.showUpgradeHint ? (
          <p className="text-meta text-[var(--fg-3)]">
            Narrated brief and nightly client scans on{" "}
            <Link href="/settings/billing" className="underline underline-offset-4">
              Starter
            </Link>
            .
          </p>
        ) : null}
      </PanelCardBody>
    </PanelCard>
  );
}