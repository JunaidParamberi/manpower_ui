import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RailField } from "./rail-field";

/**
 * One row in the document rail: a label on the left, the current value as a token on the right.
 * The whole row is the click target and opens a picker. Use for client, project, currency and dates.
 * Not for plain numbers (use InlineNumber) or on/off settings (use RailSwitch).
 */
const meta: Meta<typeof RailField> = {
  title: "Features/Documents/Workspace/Rail/RailField",
  component: RailField,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-[300px] bg-[var(--panel)] p-3"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof RailField>;

export const Default: Story = { args: { label: "Client", children: <span className="truncate">Acme Studio</span> } };
export const Warn: Story = { args: { label: "Due", warn: true, children: "Add date" } };
export const Open: Story = { args: { label: "Project", open: true, children: <span className="truncate">Brand refresh</span> } };
export const Disabled: Story = { args: { label: "Currency", disabled: true, children: <code className="font-mono text-[11px]">AED</code> } };
export const LongValue: Story = { args: { label: "Client", children: <span className="truncate">Northwind Laboratories International Holdings</span> } };
