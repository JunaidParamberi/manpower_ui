import Link from "next/link";
import {
  CheckCircle2,
  DollarSign,
  Eye,
  FileText,
  FolderOpen,
  ThumbsDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PanelCard,
  PanelCardBody,
  PanelCardHeader,
  PanelCardList,
  PanelCardRow,
} from "@/components/shared/panel-card";
import { formatActivityTimestamp } from "@/lib/dashboard/activity-utils";
import type { ActivityEvent, ActivityEventType } from "@/lib/dashboard/types";
import { formatCurrency } from "@/lib/utils/format";

type Props = {
  events: ActivityEvent[];
  /** Used only for events that carry no currency of their own. */
  fallbackCurrency: string;
};

type Tone = {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

const TONE: Record<ActivityEventType, Tone> = {
  invoice_paid: {
    icon: DollarSign,
    iconBg: "color-mix(in srgb, var(--success) 12%, transparent)",
    iconColor: "var(--success)",
  },
  doc_sent: {
    icon: FileText,
    iconBg: "var(--bg-subtle)",
    iconColor: "var(--fg-2)",
  },
  quote_approved: {
    icon: CheckCircle2,
    iconBg: "color-mix(in srgb, var(--success) 12%, transparent)",
    iconColor: "var(--success)",
  },
  quote_declined: {
    icon: ThumbsDown,
    iconBg: "color-mix(in srgb, var(--danger) 12%, transparent)",
    iconColor: "var(--danger)",
  },
  project_status_changed: {
    icon: FolderOpen,
    iconBg: "var(--bg-subtle)",
    iconColor: "var(--fg-2)",
  },
};

function VIEW_ICON_TONE(): Tone {
  return {
    icon: Eye,
    iconBg: "color-mix(in srgb, var(--info) 12%, transparent)",
    iconColor: "var(--info)",
  };
}

const VISIBLE_LIMIT = 5;

export function ActivityFeed({ events, fallbackCurrency }: Props) {
  const visible = events.slice(0, VISIBLE_LIMIT);
  return (
    <PanelCard>
      <PanelCardHeader
        title="Activity"
        meta={
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/documents" />}>
            View all
          </Button>
        }
      />
      {visible.length === 0 ? (
        <PanelCardBody>
          <p className="py-4 text-center text-body text-muted-foreground">
            No recent activity in the last 30 days.
          </p>
        </PanelCardBody>
      ) : (
        <PanelCardList>
          {visible.map((event) => {
            const tone = TONE[event.type] ?? VIEW_ICON_TONE();
            const Icon = tone.icon;
            // Each event is priced in its own document's currency; the
            // profile default would relabel an AED invoice as INR.
            const amountText =
              event.amount !== null && event.amount !== undefined
                ? formatCurrency(event.amount, event.currency ?? fallbackCurrency)
                : null;
            return (
              <PanelCardRow key={event.id} href={event.href}>
                <div
                  className="flex size-[26px] shrink-0 items-center justify-center rounded-md"
                  style={{ background: tone.iconBg, color: tone.iconColor }}
                >
                  <Icon size={14} strokeWidth={1.6} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="truncate leading-snug">
                    <span className="font-medium text-foreground">{event.who}</span>{" "}
                    <span className="text-muted-foreground">{event.text}</span>
                    {amountText && (
                      <span className="text-muted-foreground">
                        {" · "}
                        <span className="tabular-nums">{amountText}</span>
                      </span>
                    )}
                    {event.metaSuffix && (
                      <span className="text-[var(--fg-3)]">
                        {" · "}
                        {event.metaSuffix}
                      </span>
                    )}
                  </div>
                  <p className="text-label text-[var(--fg-3)]">{formatActivityTimestamp(event.timestamp)}</p>
                </div>
              </PanelCardRow>
            );
          })}
        </PanelCardList>
      )}
    </PanelCard>
  );
}
