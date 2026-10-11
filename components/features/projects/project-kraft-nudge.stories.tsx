import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AiPanelProvider } from "@/lib/ai-panel/context";
import { computePace, type PaceInput } from "@/lib/projects/project-pace";
import { ProjectKraftNudge } from "./project-kraft-nudge";

const base: PaceInput = { status: "active", startDate: "2026-09-01", createdAt: "2026-08-20", deadline: "2026-10-31", workDone: 0.5, budget: 10000, spent: 4000, today: "2026-10-01" };

/**
 * One slim line from Kraft offering to draft a client update when a project
 * is late, behind or spending ahead of the work. Renders nothing for healthy
 * projects — never show it as decoration.
 */
const meta: Meta<typeof ProjectKraftNudge> = {
  title: "Features/Projects/ProjectKraftNudge",
  component: ProjectKraftNudge,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [(Story) => <AiPanelProvider><div className="max-w-[720px]"><Story /></div></AiPanelProvider>],
  args: { clientName: "Cedar Media LLC", projectTitle: "Cedar Pitch Deck", onDraft: () => {} },
};
export default meta;
type Story = StoryObj<typeof ProjectKraftNudge>;

export const Late: Story = { args: { pace: computePace({ ...base, deadline: "2026-09-20", workDone: 0.14 }) } };
export const Behind: Story = { args: { pace: computePace({ ...base, workDone: 0.3, spent: 3000 }) } };
export const OnPaceRendersNothing: Story = { args: { pace: computePace(base) } };
