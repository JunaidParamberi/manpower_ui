"use client";

import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  List,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  monthLabel,
  rollMonth,
  rollWeek,
  weekRangeLabel,
} from "@/lib/marketing/calendar-utils";
import {
  buildMarketingHref,
  monthOf,
  snapToMonday,
  weekAnchorOf,
  type MarketingView,
  type MarketingViewParams,
} from "@/lib/marketing/marketing-view-params";
import { COMMON_PLATFORMS } from "@/lib/marketing/platform-icon";
import { postStatusLabel } from "@/lib/marketing/post-display";
import { cn } from "@/lib/utils";
import { POST_STATUSES, type PostStatus } from "@/lib/validations/content-post";

const ALL = "all";

/** Local Date for a YYYY-MM-DD string, timezone-agnostic. */
function isoToLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const VIEW_OPTIONS: Array<{
  view: MarketingView;
  label: string;
  icon: typeof CalendarDays;
}> = [
  { view: "month", label: "Month", icon: CalendarDays },
  { view: "week", label: "Week", icon: CalendarRange },
  { view: "agenda", label: "Agenda", icon: List },
];

type MarketingFilterBarProps = {
  params: MarketingViewParams;
  clients: Array<{ id: string; name: string }>;
  postPlatforms: string[];
  onNavigate: (href: string) => void;
};

/**
 * Period navigation, view switch, and the client/platform/status filters.
 *
 * Every control navigates: state lives in the URL, so filters survive month
 * navigation and reload, and a filtered calendar is a shareable link. The
 * period label also lives here rather than inside the calendar, which is what
 * removes the duplicated header row the first version had.
 */
export function MarketingFilterBar({
  params,
  clients,
  postPlatforms,
  onNavigate,
}: MarketingFilterBarProps) {
  const isWeek = params.view === "week";

  const periodLabel = isWeek
    ? weekRangeLabel(params.week)
    : monthLabel(params.month);

  function shiftPeriod(delta: number) {
    onNavigate(
      isWeek
        ? buildMarketingHref({ week: rollWeek(params.week, delta) }, params)
        : buildMarketingHref({ month: rollMonth(params.month, delta) }, params),
    );
  }

  function goToToday() {
    const now = new Date();
    onNavigate(
      buildMarketingHref(
        { month: monthOf(now), week: weekAnchorOf(now) },
        params,
      ),
    );
  }

  /**
   * A view switch keeps the user where they were. Both period params now
   * travel in every href, so switching views only has to make the two agree:
   * going to week view moves the week anchor into the month on screen (unless
   * it is already there), and leaving week view moves the month to the one
   * containing the week on screen. `-07` is deliberate — snapping the 7th back
   * to its Monday always lands on a Monday inside that month.
   */
  function viewSwitchPatch(next: MarketingView): Partial<MarketingViewParams> {
    if (next === "week" && !isWeek) {
      const weekMonth = monthOf(isoToLocalDate(params.week));
      return weekMonth === params.month
        ? { view: next }
        : { view: next, week: snapToMonday(`${params.month}-07`) };
    }
    if (next !== "week" && isWeek) {
      return { view: next, month: monthOf(isoToLocalDate(params.week)) };
    }
    return { view: next };
  }

  // The union of the platforms we always offer, the platforms actually present
  // on the loaded posts, and the active filter value. Deriving options from
  // the loaded posts alone left the filter with a single option in an empty
  // month — including when a platform filter was active.
  const platformOptions = Array.from(
    new Set([
      ...COMMON_PLATFORMS,
      ...postPlatforms,
      ...(params.platform !== ALL ? [params.platform] : []),
    ]),
  ).sort((a, b) => a.localeCompare(b));

  const selectedClientName = clients.find((c) => c.id === params.client)?.name;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={isWeek ? "Previous week" : "Previous month"}
          onClick={() => shiftPeriod(-1)}
        >
          <ChevronLeft />
        </Button>
        <p className="min-w-[9.5rem] px-1 text-center font-heading text-sm font-semibold text-foreground">
          {periodLabel}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={isWeek ? "Next week" : "Next month"}
          onClick={() => shiftPeriod(1)}
        >
          <ChevronRight />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="default"
          className="ms-1"
          onClick={goToToday}
        >
          Today
        </Button>
      </div>

      <div className="flex items-center overflow-hidden rounded-md border border-border">
        {VIEW_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const active = params.view === option.view;
          return (
            <Button
              key={option.view}
              type="button"
              variant={active ? "secondary" : "ghost"}
              size="default"
              aria-pressed={active}
              className={cn(
                "gap-1.5 rounded-none border-0",
                index > 0 && "border-s border-border",
              )}
              onClick={() =>
                onNavigate(
                  buildMarketingHref(viewSwitchPatch(option.view), params),
                )
              }
            >
              <Icon className="size-3.5" aria-hidden />
              {option.label}
            </Button>
          );
        })}
      </div>

      <Select
        value={params.client}
        onValueChange={(value) =>
          onNavigate(buildMarketingHref({ client: value || ALL }, params))
        }
      >
        {/* The height override MUST keep the `data-[size=default]:` prefix.
            SelectTrigger sets its height as `data-[size=default]:h-11`, an
            attribute selector that outranks a plain `h-[30px]` utility on
            specificity — and twMerge does not dedupe across a variant prefix,
            so the base class would survive and win. Matching the prefix lets
            twMerge replace it. py-0 stops the trigger's py-2 overflowing the
            fixed height. Result: 30px, exactly matching the buttons. */}
        <SelectTrigger
          className="w-[10rem] py-0 data-[size=default]:h-[30px]"
          aria-label="Filter by client"
        >
          <SelectValue placeholder="All clients">
            {/* A `client` uuid that is not in `clients` (deleted client, stale
                shared link) still filters the calendar, so the trigger must not
                claim "All clients" — that would hide an active filter. */}
            {params.client === ALL
              ? "All clients"
              : (selectedClientName ?? "Unknown client")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All clients</SelectItem>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.platform}
        onValueChange={(value) =>
          onNavigate(buildMarketingHref({ platform: value || ALL }, params))
        }
      >
        <SelectTrigger
          className="w-[10rem] py-0 data-[size=default]:h-[30px]"
          aria-label="Filter by platform"
        >
          <SelectValue placeholder="All platforms">
            {params.platform === ALL ? "All platforms" : params.platform}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All platforms</SelectItem>
          {platformOptions.map((platform) => (
            <SelectItem key={platform} value={platform}>
              {platform}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.status}
        onValueChange={(value) =>
          onNavigate(
            buildMarketingHref(
              { status: (value || ALL) as PostStatus | "all" },
              params,
            ),
          )
        }
      >
        <SelectTrigger
          className="w-[10rem] py-0 data-[size=default]:h-[30px]"
          aria-label="Filter by status"
        >
          <SelectValue placeholder="All statuses">
            {params.status === ALL ? "All statuses" : postStatusLabel(params.status)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {POST_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {postStatusLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
