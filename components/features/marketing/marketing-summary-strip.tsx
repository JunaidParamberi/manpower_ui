"use client";

import { CalendarClock, CheckCircle2, Lightbulb, PenLine } from "lucide-react";

import { KpiCard } from "@/components/shared/kpi-card";
import {
  buildMarketingHref,
  type MarketingViewParams,
} from "@/lib/marketing/marketing-view-params";
import type { PostStatus } from "@/lib/validations/content-post";

type MarketingSummaryStripProps = {
  /**
   * Every post the user can currently see — the visible period plus the
   * unscheduled rail — before status filtering.
   */
  posts: Array<{ status: PostStatus }>;
  params: MarketingViewParams;
};

const TILES: Array<{
  status: PostStatus;
  label: string;
  tone: "default" | "info" | "success" | "warning";
  icon: typeof Lightbulb;
}> = [
  { status: "idea", label: "Ideas", tone: "default", icon: Lightbulb },
  { status: "drafted", label: "Drafted", tone: "warning", icon: PenLine },
  { status: "scheduled", label: "Scheduled", tone: "info", icon: CalendarClock },
  { status: "posted", label: "Posted", tone: "success", icon: CheckCircle2 },
];

/**
 * Four status counts for the visible period, matching TasksSummaryStrip so
 * /marketing reads like the rest of the app. Each tile is a link that toggles
 * the `status` URL filter: clicking an active tile clears it back to "all".
 *
 * Counts are computed from the unfiltered posts the caller passes (visible
 * period + unscheduled), so the strip keeps showing the whole picture while a
 * status filter is applied.
 */
export function MarketingSummaryStrip({
  posts,
  params,
}: MarketingSummaryStripProps) {
  const counts = TILES.map(
    (tile) => posts.filter((post) => post.status === tile.status).length,
  );

  return (
    <div className="grid gap-3 @sm/shell:grid-cols-2 @3xl/shell:grid-cols-4">
      {TILES.map((tile, index) => {
        const active = params.status === tile.status;
        return (
          <KpiCard
            key={tile.status}
            label={tile.label}
            value={counts[index]}
            tone={tile.tone}
            icon={tile.icon}
            href={buildMarketingHref(
              { status: active ? "all" : tile.status },
              params,
            )}
            active={active}
            delay={index * 40}
          />
        );
      })}
    </div>
  );
}
