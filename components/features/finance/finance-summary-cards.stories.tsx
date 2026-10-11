import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FinanceSummaryCards } from "./finance-summary-cards";

const meta: Meta<typeof FinanceSummaryCards> = {
  title: "Features/Finance/FinanceSummaryCards",
  component: FinanceSummaryCards,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof FinanceSummaryCards>;

export const Default: Story = {
  args: {
    summary: {
      primaryCurrency: "AED",
      totalRevenue: 42500,
      outstanding: 8200,
      overdue: 3100,
      avgPayDays: 14,
      revenueChangePct: 12,
      overdueCount: 2,
      outstandingCount: 3,
      baseCurrency: "AED",
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
    },
  },
};

/** Money in more than one currency: extras sit under the headline figure. */
export const MultiCurrency: Story = {
  args: {
    summary: {
      primaryCurrency: "AED",
      totalRevenue: 42500,
      outstanding: 8200,
      overdue: 3100,
      avgPayDays: 14,
      revenueChangePct: 12,
      overdueCount: 2,
      outstandingCount: 3,
      baseCurrency: "AED",
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
          currency: "USD",
          totalRevenue: 3200,
          outstanding: 1500,
          overdue: 1500,
          outstandingCount: 1,
          overdueCount: 1,
        },
      ],
    },
  },
};

export const Empty: Story = {
  args: {
    summary: {
      primaryCurrency: "AED",
      totalRevenue: 0,
      outstanding: 0,
      overdue: 0,
      avgPayDays: null,
      revenueChangePct: null,
      overdueCount: 0,
      outstandingCount: 0,
      baseCurrency: "AED",
      byCurrency: [],
    },
  },
};
