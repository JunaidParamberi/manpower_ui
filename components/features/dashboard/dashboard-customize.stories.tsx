import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DashboardCustomizeButton, DashboardCustomizeContext } from "./dashboard-customize";

/**
 * The dashboard's Customize toggle. It reads its state from DashboardLanes'
 * context, so it can sit in the queue header. Renders nothing outside that
 * provider — don't use it elsewhere.
 */
const meta: Meta<typeof DashboardCustomizeButton> = {
  title: "Features/Dashboard/DashboardCustomizeButton",
  component: DashboardCustomizeButton,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof DashboardCustomizeButton>;

function WithState({ initial }: { initial: boolean }) {
  const [editing, setEditing] = useState(initial);
  return (
    <DashboardCustomizeContext.Provider value={{ editing, toggle: () => setEditing((v) => !v) }}>
      <DashboardCustomizeButton />
    </DashboardCustomizeContext.Provider>
  );
}

export const Idle: Story = { render: () => <WithState initial={false} /> };
export const Editing: Story = { render: () => <WithState initial /> };
export const OutsideProvider: Story = { render: () => <DashboardCustomizeButton /> };
