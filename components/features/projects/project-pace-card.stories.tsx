import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { computePace, type PaceInput } from "@/lib/projects/project-pace";
import { ProjectPaceCard } from "./project-pace-card";

const base: PaceInput = { status: "active", startDate: "2026-09-01", createdAt: "2026-08-20", deadline: "2026-10-31", workDone: 0.52, budget: 12000, spent: 5200, today: "2026-10-01" };
const facts = { taskDone: 7, taskTotal: 13, loggedHours: 41, spend: 5200, budget: 12000, currency: "AED" };

/**
 * The project workspace's headline: the pace verdict in words, the big pace
 * bar (work vs time vs budget) and four facts. Use at the top of a project
 * workspace; don't use in lists — rows use the small PaceBar instead.
 */
const meta: Meta<typeof ProjectPaceCard> = {
  title: "Features/Projects/ProjectPaceCard",
  component: ProjectPaceCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [(Story) => <div className="@container/shell max-w-[720px]"><Story /></div>],
  args: { startLabel: "Start Sep 1", dueLabel: "Oct 31", facts },
};
export default meta;
type Story = StoryObj<typeof ProjectPaceCard>;

export const OnPace: Story = { args: { pace: computePace(base) } };
export const OverBudget: Story = { args: { pace: computePace({ ...base, spent: 10400 }), facts: { ...facts, spend: 10400 } } };
export const Late: Story = { args: { pace: computePace({ ...base, deadline: "2026-09-20", workDone: 0.14 }), dueLabel: "Sep 20" } };
export const NoBudget: Story = { args: { pace: computePace({ ...base, budget: null }), facts: { ...facts, budget: null } } };
