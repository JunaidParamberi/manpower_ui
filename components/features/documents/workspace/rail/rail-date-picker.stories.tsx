import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { RailDatePicker } from "./rail-date-picker";
import { RailField } from "./rail-field";

/**
 * Pick a date from payment-term chips and a month calendar. Use for an invoice's due date,
 * a quote's valid-until date and an LPO's validity. Not for date ranges or times.
 */
const meta: Meta<typeof RailDatePicker> = {
  title: "Features/Documents/Workspace/Rail/RailDatePicker",
  component: RailDatePicker,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-[300px] bg-[var(--panel)] p-3"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof RailDatePicker>;

function Demo({ initial, withTerms, clearable, label }: { initial: string | null; withTerms: boolean; clearable: boolean; label: string }) {
  const [value, setValue] = useState<string | null>(initial);
  const [terms, setTerms] = useState<string | null>(null);
  return (
    <RailDatePicker
      side="bottom"
      today="2026-10-09"
      referenceDate="2026-10-09"
      value={value}
      withTerms={withTerms}
      clearable={clearable}
      onChange={(iso, t) => {
        setValue(iso);
        setTerms(t);
      }}
      trigger={
        <RailField label={label} warn={!value}>
          {value ? <><span>{value}</span>{terms ? <span className="text-[12px] font-normal text-[var(--fg-3)]">{terms}</span> : null}</> : "Add date"}
        </RailField>
      }
    />
  );
}

export const DueDate: Story = { render: () => <Demo initial="2026-11-08" withTerms clearable={false} label="Due" /> };
export const NoDueDate: Story = { render: () => <Demo initial={null} withTerms clearable={false} label="Due" /> };
export const ValidUntil: Story = { render: () => <Demo initial="2026-11-08" withTerms={false} clearable label="Valid until" /> };
