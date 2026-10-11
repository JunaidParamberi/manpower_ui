import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TaxDefaultsForm } from "./tax-defaults-form";

/**
 * TaxDefaultsForm lets users set a default tax mode and rate applied
 * to new invoices and quotes across their workspace.
 *
 * **When to use:** Mount on the `/settings/profile` page after the profile form.
 *
 * **When not to use:** Not for per-document overrides — those live in the invoice/quote editor.
 */
const meta: Meta<typeof TaxDefaultsForm> = {
  title: "Features/Settings/TaxDefaultsForm",
  component: TaxDefaultsForm,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TaxDefaultsForm>;

export const Default: Story = {
  args: { defaultMode: "none", defaultRate: 0 },
};

export const Vat: Story = {
  args: { defaultMode: "vat", defaultRate: 5 },
};

export const CgstSgst: Story = {
  args: { defaultMode: "cgst_sgst", defaultRate: 18 },
};
