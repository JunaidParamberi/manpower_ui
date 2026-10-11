import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlanCard } from "./plan-card";
import { PLANS } from "@/config/plans";

const meta: Meta<typeof PlanCard> = {
  title: "Features/Billing/PlanCard",
  component: PlanCard,
  parameters: { layout: "padded" },
  args: {
    loading: false,
    onUpgrade: () => {},
    onManageBilling: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof PlanCard>;

export const FreeCurrent: Story = {
  args: { plan: PLANS.free, currentPlan: "free" },
};

export const StarterUpgrade: Story = {
  args: { plan: PLANS.starter, currentPlan: "free" },
};

export const ProUpgrade: Story = {
  args: { plan: PLANS.pro, currentPlan: "free" },
};

export const ProCurrent: Story = {
  args: { plan: PLANS.pro, currentPlan: "pro" },
};

export const AgencyUpgrade: Story = {
  args: { plan: PLANS.agency, currentPlan: "pro" },
};

export const Downgrade: Story = {
  args: { plan: PLANS.starter, currentPlan: "pro" },
};

export const LoadingState: Story = {
  args: { plan: PLANS.starter, currentPlan: "free", loading: true },
};
