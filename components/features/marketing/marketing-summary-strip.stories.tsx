import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { MarketingViewParams } from "@/lib/marketing/marketing-view-params";
import type { PostStatus } from "@/lib/validations/content-post";

import { MarketingSummaryStrip } from "./marketing-summary-strip";

const PARAMS: MarketingViewParams = {
  view: "month",
  month: "2026-06",
  week: "2026-06-15",
  client: "all",
  platform: "all",
  status: "all",
  campaign: "all",
};

function posts(counts: Record<PostStatus, number>) {
  return (Object.keys(counts) as PostStatus[]).flatMap((status) =>
    Array.from({ length: counts[status] }, () => ({ status })),
  );
}

const meta: Meta<typeof MarketingSummaryStrip> = {
  title: "Marketing/MarketingSummaryStrip",
  component: MarketingSummaryStrip,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Four KPI tiles counting the visible period's posts by status — ideas, drafted, scheduled, posted. Gives /marketing the same at-a-glance read that /tasks gets from `TasksSummaryStrip`. Each tile links to the same page with the `status` URL filter set, and clicking the already-active tile clears the filter, so the strip doubles as the status filter control. Counts always come from the unfiltered period, so applying a filter never makes the other numbers disappear. Don't use it for cross-period totals — it only ever describes the month or week currently on screen.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="@container/shell w-full max-w-4xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MarketingSummaryStrip>;

export const Default: Story = {
  args: {
    params: PARAMS,
    posts: posts({ idea: 4, drafted: 3, scheduled: 6, posted: 11 }),
  },
};

export const FilteredToScheduled: Story = {
  args: {
    params: { ...PARAMS, status: "scheduled" },
    posts: posts({ idea: 4, drafted: 3, scheduled: 6, posted: 11 }),
  },
};

export const EmptyMonth: Story = {
  args: {
    params: PARAMS,
    posts: [],
  },
};
