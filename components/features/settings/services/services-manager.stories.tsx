import type { Meta, StoryObj } from "@storybook/react";
import { ServicesManager } from "./services-manager";
import type { ServiceRow } from "@/types";

const meta: Meta<typeof ServicesManager> = {
  title: "Features/Settings/Services/ServicesManager",
  component: ServicesManager,
  parameters: {
    docs: {
      description: {
        component:
          "Full services catalog for the /services route. Supports create/edit/archive/delete with search and type filter. Pass server-fetched services as `initialServices`. Do not use inside document editors.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ServicesManager>;

const mockServices: ServiceRow[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    user_id: "user-1",
    name: "Brand identity package",
    description: "Logo, colour palette, and usage guidelines",
    service_type: "service",
    unit: "project",
    sku: null,
    default_qty: 1,
    cost_price: null,
    default_rate: 1500,
    default_tax_mode: "vat",
    default_tax_rate: 5,
    hsn_sac_code: "998391",
    archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    user_id: "user-1",
    name: "Monthly retainer",
    description: "Ongoing design support — up to 20 hrs",
    service_type: "service",
    unit: "month",
    sku: null,
    default_qty: 1,
    cost_price: null,
    default_rate: 3000,
    default_tax_mode: "none",
    default_tax_rate: 0,
    hsn_sac_code: null,
    archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    user_id: "user-1",
    name: "Figma UI kit",
    description: "100-component design system, lifetime license",
    service_type: "product",
    unit: "license",
    sku: "FIG-KIT-001",
    default_qty: 1,
    cost_price: 20,
    default_rate: 149,
    default_tax_mode: "vat",
    default_tax_rate: 5,
    hsn_sac_code: null,
    archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    user_id: "user-1",
    name: "Stock photography license",
    description: null,
    service_type: "asset",
    unit: "item",
    sku: "STOCK-PH",
    default_qty: 1,
    cost_price: 15,
    default_rate: 50,
    default_tax_mode: "none",
    default_tax_rate: 0,
    hsn_sac_code: null,
    archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const WithServices: Story = {
  args: { initialServices: mockServices },
};

export const Empty: Story = {
  args: { initialServices: [] },
};
