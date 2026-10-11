import type { Meta, StoryObj } from "@storybook/react";
import { TimeBillingBar } from "./time-billing-bar";

const meta: Meta<typeof TimeBillingBar> = {
  title: "Features/Time/TimeBillingBar",
  component: TimeBillingBar,
  parameters: {
    docs: {
      description: {
        component:
          "Sticky action bar shown on /time when billable entries are selected. Displays count, total hours, and an estimated invoice total, and launches the time-to-invoice conversion. Disabled when the selection spans multiple clients (an invoice belongs to a single client) or while a conversion is pending. Not shown when nothing is selected.",
      },
    },
  },
  args: { currency: "AED", pending: false, onCreate: () => {} },
};
export default meta;
type Story = StoryObj<typeof TimeBillingBar>;

export const SingleClient: Story = {
  args: {
    summary: { count: 3, totalHours: 6.5, estTotal: 650, clientId: "c1", mixed: false },
  },
};

export const MixedClientBlocked: Story = {
  args: {
    summary: { count: 4, totalHours: 8, estTotal: 0, clientId: null, mixed: true },
  },
};

export const ZeroRateEstimate: Story = {
  args: {
    summary: { count: 2, totalHours: 3, estTotal: 0, clientId: "c1", mixed: false },
  },
};

export const Pending: Story = {
  args: {
    summary: { count: 3, totalHours: 6.5, estTotal: 650, clientId: "c1", mixed: false },
    pending: true,
  },
};

export const NothingSelected: Story = {
  args: {
    summary: { count: 0, totalHours: 0, estTotal: 0, clientId: null, mixed: false },
  },
};
