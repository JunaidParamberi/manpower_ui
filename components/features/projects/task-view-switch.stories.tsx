import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ProjectsHubViewMode } from "@/lib/projects/hub-view-preference";
import { TaskViewSwitch } from "./task-view-switch";

/** List / Board switch for a project's tasks. Use above a project's task list or board; not for page-level views. */
const meta: Meta<typeof TaskViewSwitch> = {
  title: "Features/Projects/TaskViewSwitch",
  component: TaskViewSwitch,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof TaskViewSwitch>;

function Live({ initial }: { initial: ProjectsHubViewMode }) {
  const [v, setV] = useState(initial);
  return <TaskViewSwitch value={v} onChange={setV} />;
}
export const ListSelected: Story = { render: () => <Live initial="list" /> };
export const BoardSelected: Story = { render: () => <Live initial="board" /> };
