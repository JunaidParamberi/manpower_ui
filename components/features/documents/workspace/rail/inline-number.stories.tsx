import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { InlineNumber } from "./inline-number";

/**
 * A number that reads as text in the document settings rail. Click to type,
 * ↑/↓ to step (Shift ×10), or drag the label sideways to scrub.
 * Use for rates and amounts in the rail. Not for line-item qty/rate on the paper
 * (those are LineItemsGrid cells) and not for long free-form amounts in forms.
 */
const meta: Meta<typeof InlineNumber> = {
  title: "Features/Documents/Workspace/Rail/InlineNumber",
  component: InlineNumber,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-[300px] bg-[var(--panel)] p-3"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof InlineNumber>;

function TaxRate({ disabled }: { disabled?: boolean }) {
  const [v, setV] = useState(5);
  return <InlineNumber id="story-rate" label="Rate" value={v} onChange={setV} suffix="%" bounds={{ min: 0, max: 100, step: 0.5 }} disabled={disabled} />;
}
function Discount() {
  const [v, setV] = useState(0);
  const [u, setU] = useState("percent");
  return (
    <InlineNumber
      id="story-discount"
      label="Discount"
      value={v}
      onChange={setV}
      bounds={{ min: 0, max: u === "percent" ? 100 : 100000, step: 1 }}
      unit={{ options: [{ value: "percent", label: "%" }, { value: "flat", label: "AED" }], value: u, onChange: setU }}
    />
  );
}
export const Rate: Story = { render: () => <TaxRate /> };
export const DiscountWithUnit: Story = { render: () => <Discount /> };
export const ReadOnly: Story = { render: () => <TaxRate disabled /> };
