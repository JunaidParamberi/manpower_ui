import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BillingPageClient } from "./billing-page-client";

const meta: Meta<typeof BillingPageClient> = {
  title: "Features/Billing/BillingPageClient",
  component: BillingPageClient,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="p-8 max-w-5xl mx-auto">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BillingPageClient>;

export const FreePlan: Story = {
  args: {
    currentPlan: "free",
    subscription: null,
  },
};

export const StarterActive: Story = {
  args: {
    currentPlan: "starter",
    subscription: {
      id: "sub-1",
      user_id: "user-1",
      lemon_squeezy_id: "ls-123",
      ls_customer_id: "cust-1",
      ls_variant_id: "1173919",
      customer_portal_url: "https://app.lemonsqueezy.com/billing",
      plan: "starter",
      status: "active",
      current_period_end: "2026-07-26T00:00:00Z",
      created_at: "2026-06-26T00:00:00Z",
      updated_at: "2026-06-26T00:00:00Z",
    },
  },
};

export const ProActive: Story = {
  args: {
    currentPlan: "pro",
    subscription: {
      id: "sub-2",
      user_id: "user-1",
      lemon_squeezy_id: "ls-456",
      ls_customer_id: "cust-1",
      ls_variant_id: "1173949",
      customer_portal_url: "https://app.lemonsqueezy.com/billing",
      plan: "pro",
      status: "active",
      current_period_end: "2026-07-26T00:00:00Z",
      created_at: "2026-06-26T00:00:00Z",
      updated_at: "2026-06-26T00:00:00Z",
    },
  },
};

export const PastDue: Story = {
  args: {
    currentPlan: "pro",
    subscription: {
      id: "sub-3",
      user_id: "user-1",
      lemon_squeezy_id: "ls-789",
      ls_customer_id: "cust-1",
      ls_variant_id: "1173949",
      customer_portal_url: "https://app.lemonsqueezy.com/billing",
      plan: "pro",
      status: "past_due",
      current_period_end: "2026-07-01T00:00:00Z",
      created_at: "2026-06-26T00:00:00Z",
      updated_at: "2026-06-26T00:00:00Z",
    },
  },
};
