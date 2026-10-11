import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BillingCurrentPlan } from "./billing-current-plan";

const meta: Meta<typeof BillingCurrentPlan> = {
  title: "Features/Billing/BillingCurrentPlan",
  component: BillingCurrentPlan,
  parameters: { layout: "padded" },
  args: { loading: false, onManageBilling: () => {}, onUpgrade: () => {} },
};
export default meta;
type Story = StoryObj<typeof BillingCurrentPlan>;

const activeSub = {
  id: "sub_1",
  user_id: "u1",
  lemon_squeezy_id: "999",
  ls_customer_id: null,
  ls_variant_id: null,
  customer_portal_url: "https://app.lemonsqueezy.com/billing",
  plan: "pro" as const,
  status: "active" as const,
  current_period_end: "2026-07-01T00:00:00.000Z",
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
};

export const FreePlan: Story = {
  args: { plan: "free", subscription: null },
};

export const ActivePro: Story = {
  args: { plan: "pro", subscription: activeSub },
};

export const PastDue: Story = {
  args: {
    plan: "pro",
    subscription: { ...activeSub, status: "past_due" },
  },
};

export const Cancelled: Story = {
  args: {
    plan: "starter",
    subscription: {
      ...activeSub,
      plan: "starter",
      status: "cancelled",
      lemon_squeezy_id: "888",
      current_period_end: "2026-07-15T00:00:00.000Z",
    },
  },
};

export const Loading: Story = {
  args: { plan: "pro", subscription: activeSub, loading: true },
};
