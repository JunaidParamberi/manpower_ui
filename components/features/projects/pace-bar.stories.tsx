import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { computePace, type PaceInput } from "@/lib/projects/project-pace";
import { PaceBar } from "./pace-bar";

const base: PaceInput = { status: "active", startDate: "2026-09-01", createdAt: "2026-08-20", deadline: "2026-10-31", workDone: 0.5, budget: 10000, spent: 4000, today: "2026-10-01" };

/** Work done (fill) vs time elapsed (tick) vs budget used (hairline). Use for project progress; not for single tasks. */
const meta: Meta<typeof PaceBar> = {
  title: "Features/Projects/PaceBar",
  component: PaceBar,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [(Story) => <div className="max-w-80"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PaceBar>;

export const OnPace: Story = { args: { pace: computePace(base) } };
export const Behind: Story = { args: { pace: computePace({ ...base, workDone: 0.3, spent: 3000 }) } };
export const OverBudget: Story = { args: { pace: computePace({ ...base, spent: 8200 }) } };
export const Late: Story = { args: { pace: computePace({ ...base, deadline: "2026-09-20", workDone: 0.14 }) } };
export const NoDeadline: Story = { args: { pace: computePace({ ...base, deadline: null }) } };
export const Paused: Story = { args: { pace: computePace({ ...base, status: "on_hold" }) } };
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <PaceBar pace={computePace(base)} size="sm" />
      <PaceBar pace={computePace(base)} size="md" />
      <PaceBar pace={computePace(base)} size="lg" />
    </div>
  ),
};
