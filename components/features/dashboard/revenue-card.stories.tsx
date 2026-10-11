import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RevenueCard } from "./revenue-card";

/**
 * Monthly revenue trend for the dashboard, with totals underneath.
 *
 * Revenue is money actually received (the `payments` table), in a single
 * currency, so it always agrees with the revenue KPI above it. Months with no
 * income render as zero rather than disappearing. The 6M/1Y/All switch is a
 * link that sets `?revenue=` on the dashboard URL — the page re-queries
 * server-side, so there is no client fetch here.
 *
 * Don't use it for a per-client split (that's RevenueByClientPanel) or for
 * invoiced-but-unpaid amounts, which belong to the Outstanding KPI.
 */
const meta: Meta<typeof RevenueCard> = {
  title: "Features/Dashboard/RevenueCard",
  component: RevenueCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof RevenueCard>;

export const Default: Story = {
  args: {
    currency: "AED",
    rangeId: "6m",
    data: [
      { month: "Dec", monthKey: "2025-12", revenue: 18000, isCurrent: false },
      { month: "Jan", monthKey: "2026-01", revenue: 22000, isCurrent: false },
      { month: "Feb", monthKey: "2026-02", revenue: 28000, isCurrent: false },
      { month: "Mar", monthKey: "2026-03", revenue: 31000, isCurrent: false },
      { month: "Apr", monthKey: "2026-04", revenue: 35000, isCurrent: false },
      { month: "May", monthKey: "2026-05", revenue: 42500, isCurrent: true },
    ],
  },
};

/** A quiet stretch: gap months are drawn as zero, not skipped. */
export const WithQuietMonths: Story = {
  args: {
    currency: "AED",
    rangeId: "1y",
    data: [
      { month: "Apr 2026", monthKey: "2026-04", revenue: 12000, isCurrent: false },
      { month: "May 2026", monthKey: "2026-05", revenue: 0, isCurrent: false },
      { month: "Jun 2026", monthKey: "2026-06", revenue: 0, isCurrent: false },
      { month: "Jul 2026", monthKey: "2026-07", revenue: 9400, isCurrent: false },
      { month: "Aug 2026", monthKey: "2026-08", revenue: 3100, isCurrent: false },
      { month: "Sep 2026", monthKey: "2026-09", revenue: 6240, isCurrent: true },
    ],
  },
};

export const AllTime: Story = {
  args: {
    currency: "USD",
    rangeId: "all",
    data: [
      { month: "Nov 2025", monthKey: "2025-11", revenue: 4200, isCurrent: false },
      { month: "Dec 2025", monthKey: "2025-12", revenue: 18000, isCurrent: false },
      { month: "Jan 2026", monthKey: "2026-01", revenue: 22000, isCurrent: false },
      { month: "Feb 2026", monthKey: "2026-02", revenue: 28000, isCurrent: true },
    ],
  },
};

export const Empty: Story = {
  args: { currency: "AED", rangeId: "6m", data: [] },
};
