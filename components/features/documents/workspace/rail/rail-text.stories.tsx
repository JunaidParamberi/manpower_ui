import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { RailText } from "./rail-text";

/**
 * A short text value in the document rail that reads as text and edits in place.
 * Use for reference numbers such as an LPO number. Not for long text: edit that on the paper.
 */
const meta: Meta<typeof RailText> = {
  title: "Features/Documents/Workspace/Rail/RailText",
  component: RailText,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-[300px] bg-[var(--panel)] p-3"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof RailText>;

function Demo({ initial, disabled, warn }: { initial: string; disabled?: boolean; warn?: boolean }) {
  const [v, setV] = useState(initial);
  return <RailText id="story-text" label="LPO number" value={v} onChange={setV} placeholder="Add number" disabled={disabled} warn={warn} />;
}
export const Filled: Story = { render: () => <Demo initial="LPO-2026-118" /> };
export const Empty: Story = { render: () => <Demo initial="" warn /> };
export const ReadOnly: Story = { render: () => <Demo initial="LPO-2026-118" disabled /> };
