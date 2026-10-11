import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MoneyRow } from "./money-row";
import type { MoneyFacts } from "@/lib/dashboard/snapshot-types";

/**
 * The four money KPIs at the top of the dashboard.
 *
 * Use it as the first thing on the dashboard: revenue booked this month,
 * what is still owed, what is late, and how long clients take to pay.
 *
 * The headline figures are always in ONE currency — `money.primaryCurrency`
 * — and any other currency the user holds money in is listed underneath, so
 * a freelancer invoicing in AED with an INR profile currency never sees a
 * misleading zero. Don't use it for a per-client or per-project breakdown;
 * those live on their own detail pages.
 */
const meta: Meta<typeof MoneyRow> = {
  title: "Features/Dashboard/MoneyRow",
  component: MoneyRow,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof MoneyRow>;

function facts(partial: Partial<MoneyFacts> = {}): MoneyFacts {
  return {
    primaryCurrency: "AED",
    totalRevenue: 42500,
    outstanding: 8200,
    overdue: 3100,
    avgPayDays: 14.2,
    revenueChangePct: 12,
    overdueCount: 2,
    outstandingCount: 3,
    byCurrency: [
      {
        currency: "AED",
        totalRevenue: 42500,
        outstanding: 8200,
        overdue: 3100,
        outstandingCount: 3,
        overdueCount: 2,
      },
    ],
    ...partial,
  };
}

export const Default: Story = {
  args: { money: facts() },
};

/** A UAE freelancer who also bills two clients in USD and one in GBP. */
export const MultiCurrency: Story = {
  args: {
    money: facts({
      byCurrency: [
        {
          currency: "AED",
          totalRevenue: 42500,
          outstanding: 8200,
          overdue: 3100,
          outstandingCount: 3,
          overdueCount: 2,
        },
        {
          currency: "GBP",
          totalRevenue: 2400,
          outstanding: 1200,
          overdue: 0,
          outstandingCount: 1,
          overdueCount: 0,
        },
        {
          currency: "USD",
          totalRevenue: 800,
          outstanding: 0,
          overdue: 0,
          outstandingCount: 0,
          overdueCount: 0,
        },
      ],
    }),
  },
};

/**
 * The regression this component was rebuilt for: the profile currency (INR)
 * holds nothing, but real money exists in AED. The headline must show the
 * AED money, never a zero.
 */
export const ProfileCurrencyHoldsNothing: Story = {
  args: {
    money: facts({
      totalRevenue: 6240,
      outstanding: 0,
      overdue: 0,
      avgPayDays: 2,
      revenueChangePct: null,
      overdueCount: 0,
      outstandingCount: 0,
      byCurrency: [
        {
          currency: "AED",
          totalRevenue: 6240,
          outstanding: 0,
          overdue: 0,
          outstandingCount: 0,
          overdueCount: 0,
        },
      ],
    }),
  },
};

export const AllClear: Story = {
  args: {
    money: facts({
      totalRevenue: 65000,
      outstanding: 0,
      overdue: 0,
      avgPayDays: 9.8,
      revenueChangePct: 24,
      overdueCount: 0,
      outstandingCount: 0,
      byCurrency: [
        {
          currency: "AED",
          totalRevenue: 65000,
          outstanding: 0,
          overdue: 0,
          outstandingCount: 0,
          overdueCount: 0,
        },
      ],
    }),
  },
};

export const Empty: Story = {
  args: {
    money: facts({
      totalRevenue: 0,
      outstanding: 0,
      overdue: 0,
      avgPayDays: null,
      revenueChangePct: null,
      overdueCount: 0,
      outstandingCount: 0,
      byCurrency: [],
    }),
  },
};