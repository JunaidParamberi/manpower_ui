import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { RailSwitch } from "./rail-switch";

/**
 * An on/off setting row. The whole row toggles the switch. Use for TDS deduction and repeat.
 * Not for choosing between several options: use PillSwitch.
 */
const meta: Meta<typeof RailSwitch> = {
  title: "Features/Documents/Workspace/Rail/RailSwitch",
  component: RailSwitch,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-[300px] bg-[var(--panel)] p-3"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof RailSwitch>;

function Demo({ initial, disabled }: { initial: boolean; disabled?: boolean }) {
  const [on, setOn] = useState(initial);
  return <RailSwitch label="TDS deduction" checked={on} onCheckedChange={setOn} disabled={disabled} />;
}
export const Off: Story = { render: () => <Demo initial={false} /> };
export const On: Story = { render: () => <Demo initial /> };
export const Disabled: Story = { render: () => <Demo initial disabled /> };
