import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ProjectsListLayout } from "@/lib/projects/list-layout-preference";
import { ProjectsViewSwitch } from "./projects-view-switch";

/** List / Board / Timeline icon switch for the projects page. Not for task views — use TaskViewSwitch there. */
const meta: Meta<typeof ProjectsViewSwitch> = {
  title: "Features/Projects/ProjectsViewSwitch",
  component: ProjectsViewSwitch,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof ProjectsViewSwitch>;

function Live({ initial }: { initial: ProjectsListLayout }) {
  const [view, setView] = useState(initial);
  return <ProjectsViewSwitch view={view} onChange={setView} />;
}
export const List: Story = { render: () => <Live initial="list" /> };
export const Board: Story = { render: () => <Live initial="board" /> };
