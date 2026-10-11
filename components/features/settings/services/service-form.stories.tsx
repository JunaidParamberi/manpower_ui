import type { Meta, StoryObj } from "@storybook/react";
import { ServiceForm } from "./service-form";
import type { ServiceRow } from "@/types";

const meta: Meta<typeof ServiceForm> = {
  title: "Features/Settings/Services/ServiceForm",
  component: ServiceForm,
  parameters: {
    docs: {
      description: {
        component:
          "Sheet form for creating or editing a reusable service/product catalog entry. Use in Settings > Services & products. Do not use for editing individual line items on documents.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ServiceForm>;

const mockService: ServiceRow = {
  id: "00000000-0000-0000-0000-000000000001",
  user_id: "user-1",
  name: "Brand identity package",
  description: "Logo, colour palette, and usage guidelines",
  service_type: "service",
  unit: "project",
  sku: "DES-001",
  default_qty: 1,
  cost_price: 300,
  default_rate: 1500,
  default_tax_mode: "vat",
  default_tax_rate: 5,
  hsn_sac_code: "998391",
  archived: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const Create: Story = {
  args: { open: true, onOpenChange: () => {} },
};

export const Edit: Story = {
  args: { open: true, onOpenChange: () => {}, service: mockService },
};

export const Closed: Story = {
  args: { open: false, onOpenChange: () => {} },
};
