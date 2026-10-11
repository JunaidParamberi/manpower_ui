import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RailField } from "./rail-field";
import { RailSection } from "./rail-section";

/**
 * A titled group of settings in the document rail, separated from the next by a hairline.
 * Use to group related rows (Details, Tax & deductions). Not for page-level content: use PanelCard.
 */
const meta: Meta<typeof RailSection> = {
  title: "Features/Documents/Workspace/Rail/RailSection",
  component: RailSection,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-[300px] bg-[var(--panel)]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof RailSection>;

export const Details: Story = {
  render: () => (
    <RailSection title="Details">
      <RailField label="Client"><span className="truncate">Acme Studio</span></RailField>
      <RailField label="Currency"><code className="rounded-[5px] border border-border bg-[var(--bg-subtle)] px-1.5 font-mono text-[11px]">AED</code></RailField>
    </RailSection>
  ),
};
