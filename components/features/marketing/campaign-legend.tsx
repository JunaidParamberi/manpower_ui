"use client";

import { X } from "lucide-react";

import { campaignColorClass } from "@/lib/marketing/campaign-color";
import type { CampaignRow } from "@/lib/marketing/campaign-queries";
import {
  buildMarketingHref,
  type MarketingViewParams,
} from "@/lib/marketing/marketing-view-params";
import { cn } from "@/lib/utils";

type CampaignLegendProps = {
  campaigns: CampaignRow[];
  params: MarketingViewParams;
  onNavigate: (href: string) => void;
  onDelete: (campaign: CampaignRow) => void;
};

/**
 * Chips for every campaign: colour dot, name, post count, and a delete button.
 *
 * Before this, a generated campaign was write-only — CampaignDialog stamped
 * campaign_id onto posts and nothing ever read it back, so there was no way to
 * see which posts belonged to a campaign or to remove a bad generation.
 *
 * Clicking a chip toggles the `campaign` URL filter; the active chip is
 * visually selected. Deleting is delegated upward so this component stays free
 * of server actions and can be storied.
 */
export function CampaignLegend({
  campaigns,
  params,
  onNavigate,
  onDelete,
}: CampaignLegendProps) {
  if (campaigns.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        Campaigns
      </span>
      {campaigns.map((campaign) => {
        const active = params.campaign === campaign.id;
        return (
          <span
            key={campaign.id}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border py-0.5 pe-0.5 ps-2 text-xs transition-colors",
              active
                ? "border-primary/40 bg-[var(--accent-soft)] text-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <button
              type="button"
              aria-pressed={active}
              onClick={() =>
                onNavigate(
                  buildMarketingHref(
                    { campaign: active ? "all" : campaign.id },
                    params,
                  ),
                )
              }
              className="inline-flex items-center gap-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  campaignColorClass(campaign.id),
                )}
                aria-hidden
              />
              <span className="max-w-[12rem] truncate">{campaign.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {campaign.postCount}
              </span>
            </button>
            <button
              type="button"
              aria-label={`Delete campaign ${campaign.name}`}
              onClick={() => onDelete(campaign)}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        );
      })}
    </div>
  );
}
