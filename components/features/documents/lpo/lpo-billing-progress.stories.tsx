import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LpoBillingProgress } from "./lpo-billing-progress";

const meta: Meta<typeof LpoBillingProgress> = {
  title: "Features/Documents/LPO/LpoBillingProgress",
  component: LpoBillingProgress,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Shows billing progress against an LPO ceiling. Two progress bars: invoiced % and paid %. Warns in amber when over ceiling. Used inside LPODetailPanel on the document detail page.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LpoBillingProgress>;

export const Empty: Story = {
  args: {
    progress: {
      lpo_amount: 10000,
      invoiced_amount: 0,
      paid_amount: 0,
      invoiced_pct: 0,
      paid_pct: 0,
      over_ceiling: false,
    },
    currency: "AED",
  },
};

export const PartiallyBilled: Story = {
  args: {
    progress: {
      lpo_amount: 10000,
      invoiced_amount: 6400,
      paid_amount: 3200,
      invoiced_pct: 64,
      paid_pct: 32,
      over_ceiling: false,
    },
    currency: "AED",
    onCreateInvoice: () => {},
  },
};

export const FullyBilled: Story = {
  args: {
    progress: {
      lpo_amount: 10000,
      invoiced_amount: 10000,
      paid_amount: 10000,
      invoiced_pct: 100,
      paid_pct: 100,
      over_ceiling: false,
    },
    currency: "AED",
  },
};

export const OverCeiling: Story = {
  args: {
    progress: {
      lpo_amount: 10000,
      invoiced_amount: 12000,
      paid_amount: 5000,
      invoiced_pct: 120,
      paid_pct: 50,
      over_ceiling: true,
    },
    currency: "AED",
  },
};
