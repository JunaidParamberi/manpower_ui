import { POST_STATUSES, type PostStatus } from "@/lib/validations/content-post";

export const MARKETING_VIEWS = ["month", "week", "agenda"] as const;
export type MarketingView = (typeof MARKETING_VIEWS)[number];

/**
 * The full, resolved state of the /marketing page, mirrored 1:1 in the URL so
 * filters survive navigation and reload and pages stay shareable. `month` and
 * `week` are both always resolved and both always travel in the URL; `view`
 * decides which of the two the page renders from.
 */
export type MarketingViewParams = {
  view: MarketingView;
  month: string; // YYYY-MM
  week: string; // YYYY-MM-DD, always a Monday
  client: string; // client uuid | "all"
  platform: string; // platform name | "all"
  status: PostStatus | "all";
  campaign: string; // campaign uuid | "all"
};

const MONTH_RE = /^\d{4}-(?:0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** The local calendar month of `date`, as YYYY-MM. */
export function monthOf(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** The Monday of the local week containing `date`, as YYYY-MM-DD. */
export function weekAnchorOf(date: Date): string {
  const shift = (date.getDay() + 6) % 7; // JS Sun=0..Sat=6 → Mon=0
  const monday = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - shift,
  );
  return `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(
    monday.getDate(),
  )}`;
}

/**
 * Snaps any YYYY-MM-DD to the Monday of its week. A hand-edited or stale
 * `week` param is corrected rather than rejected, so the calendar always has
 * a valid Monday anchor to build a grid from.
 */
export function snapToMonday(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return weekAnchorOf(new Date(year, month - 1, day));
}

export function parseMarketingViewParams(
  raw: Record<string, string | undefined>,
  now: Date,
): MarketingViewParams {
  const view = MARKETING_VIEWS.includes(raw.view as MarketingView)
    ? (raw.view as MarketingView)
    : "month";

  const month = raw.month && MONTH_RE.test(raw.month) ? raw.month : monthOf(now);

  const week =
    raw.week && DATE_RE.test(raw.week) ? snapToMonday(raw.week) : weekAnchorOf(now);

  const client = raw.client && UUID_RE.test(raw.client) ? raw.client : "all";
  const campaign =
    raw.campaign && UUID_RE.test(raw.campaign) ? raw.campaign : "all";

  const platformRaw = raw.platform?.trim() ?? "";
  const platform =
    platformRaw.length > 0 && platformRaw.length <= 60 ? platformRaw : "all";

  const status = POST_STATUSES.includes(raw.status as PostStatus)
    ? (raw.status as PostStatus)
    : "all";

  return { view, month, week, client, platform, status, campaign };
}

/**
 * Builds a /marketing href from a patch over already-resolved params. Values
 * at their default are omitted so URLs stay short. Mirrors `buildTasksHref`
 * (lib/tasks/task-utils.ts) so both filter bars behave the same. Pure — the
 * caller resolves "now" before calling.
 */
export function buildMarketingHref(
  patch: Partial<MarketingViewParams>,
  base: MarketingViewParams,
): string {
  const merged: MarketingViewParams = { ...base, ...patch };
  const params = new URLSearchParams();

  if (merged.view !== "month") {
    params.set("view", merged.view);
  }
  // Both period params are always emitted. Emitting only the one the current
  // view uses meant the other fell back to "now" on the next parse, so
  // switching from December in month view to week view landed on the current
  // week instead of December.
  params.set("month", merged.month);
  params.set("week", merged.week);
  if (merged.client !== "all") {
    params.set("client", merged.client);
  }
  if (merged.platform !== "all") {
    params.set("platform", merged.platform);
  }
  if (merged.status !== "all") {
    params.set("status", merged.status);
  }
  if (merged.campaign !== "all") {
    params.set("campaign", merged.campaign);
  }

  return `/marketing?${params.toString()}`;
}
