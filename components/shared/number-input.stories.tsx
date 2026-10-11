import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Label } from "@/components/ui/label";

import { NumberInput } from "./number-input";

/**
 * `NumberInput` is the standard control for any numeric field in Manpower
 * (amounts, quantities, rates, terms). It looks identical to the base `Input`
 * but removes the native number-input quirks that cause accidental edits:
 *
 * - no spinner arrows
 * - scroll wheel never changes the value
 * - ↑/↓ keys don't increment
 * - `e`, `E`, `+` are blocked; `-` is blocked unless `allowNegative`
 *
 * **Use it** for every `type="number"` field. **Turn on `allowNegative`** only
 * where negative values are meaningful (e.g. credit-note line amounts), and
 * **`allowDecimal={false}`** for whole-number fields (payment terms, quantity).
 */
const meta: Meta<typeof NumberInput> = {
  title: "Shared/NumberInput",
  component: NumberInput,
  tags: ["autodocs"],
  args: { placeholder: "0.00" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NumberInput>;

export const Default: Story = {};

export const Amount: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="amount">Amount (AED)</Label>
      <NumberInput id="amount" min={0} step="0.01" defaultValue={10500} {...args} />
    </div>
  ),
};

export const IntegerOnly: Story = {
  name: "Integer only (payment terms)",
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="terms">Payment terms (days)</Label>
      <NumberInput
        id="terms"
        allowDecimal={false}
        min={0}
        placeholder="30"
        {...args}
      />
    </div>
  ),
};

export const NegativeAllowed: Story = {
  name: "Negative allowed (credit note)",
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="credit">Credit amount</Label>
      <NumberInput
        id="credit"
        allowNegative
        step="0.01"
        defaultValue={-6000}
        {...args}
      />
    </div>
  ),
};

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: 12 },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 42 },
};
