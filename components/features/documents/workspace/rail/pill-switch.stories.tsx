import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { PillSwitch } from "./pill-switch";

/**
 * A short set of mutually exclusive choices shown as pills. Use for tax type and repeat frequency.
 * Not for long lists (use RailPicker) or on/off (use RailSwitch).
 */
const meta: Meta<typeof PillSwitch> = {
  title: "Features/Documents/Workspace/Rail/PillSwitch",
  component: PillSwitch,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-[300px] bg-[var(--panel)] p-3"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PillSwitch>;

const TAX = [
  { value: "none", label: "No tax" },
  { value: "vat", label: "VAT" },
  { value: "gst", label: "GST" },
  { value: "cgst_sgst", label: "CGST + SGST" },
  { value: "igst", label: "IGST" },
];
function Demo({ disabled }: { disabled?: boolean }) {
  const [v, setV] = useState("vat");
  return <PillSwitch label="Tax" options={TAX} value={v} onChange={setV} disabled={disabled} />;
}
export const Tax: Story = { render: () => <Demo /> };
export const ReadOnly: Story = { render: () => <Demo disabled /> };
