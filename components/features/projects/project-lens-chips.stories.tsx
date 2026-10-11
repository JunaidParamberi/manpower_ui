import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { PortfolioLens } from "@/lib/projects/portfolio-filters";
import { ProjectLensChips } from "./project-lens-chips";

/** Portfolio filters as chips with counts; Needs you count turns red when > 0. Use in projects block headers, not as page tabs. */
const meta: Meta<typeof ProjectLensChips> = {
  title: "Features/Projects/ProjectLensChips",
  component: ProjectLensChips,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [(Story) => <div className="max-w-[340px]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ProjectLensChips>;

function Live({ initial, needs }: { initial: PortfolioLens; needs: number }) {
  const [lens, setLens] = useState(initial);
  return <ProjectLensChips lens={lens} onChange={setLens} counts={{ all: 9, needs_you: needs, active: 5, planning: 2, done: 1 }} />;
}
export const Default: Story = { render: () => <Live initial="all" needs={3} /> };
export const NothingNeedsYou: Story = { render: () => <Live initial="all" needs={0} /> };
export const NeedsYouSelected: Story = { render: () => <Live initial="needs_you" needs={3} /> };
