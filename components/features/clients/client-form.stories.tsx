import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ClientForm } from "./client-form";

const meta: Meta<typeof ClientForm> = {
  title: "Features/Clients/ClientForm",
  component: ClientForm,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Create and edit freelancer CRM client profiles in a wide workspace canvas. Use this pattern when the form benefits from grouped sections and a live summary panel; prefer a simple card for short one-step forms.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ClientForm>;

export const Create: Story = {
  args: {
    mode: "create",
  },
};

export const OrganizationWithBilling: Story = {
  args: {
    mode: "edit",
    clientId: "11111111-1111-4111-8111-111111111111",
    defaultValues: {
      name: "Acme Design Co.",
      contact_name: "Jane Doe",
      website: "https://acmedesign.co",
      email: "hello@acmedesign.co",
      billing_email: "billing@acmedesign.co",
      phone: "+971 50 123 4567",
      company: "Acme Design Co.",
      address: "Dubai Marina, Dubai, UAE",
      currency: "AED",
      tax_id: "TRN 100-200-300",
      payment_terms_days: "30",
      relationship_status: "active",
      lead_source: "Referral",
      preferred_contact_method: "whatsapp",
      timezone: "Asia/Dubai",
      tags: "VIP, retainer",
      notes: "Prefers WhatsApp for quick approvals. Use monthly retainers.",
    },
  },
};

export const PastClient: Story = {
  args: {
    mode: "edit",
    clientId: "22222222-2222-4222-8222-222222222222",
    defaultValues: {
      name: "Maya Chen",
      contact_name: "",
      website: "",
      email: "maya@example.com",
      billing_email: "",
      phone: "",
      company: "",
      address: "",
      currency: "",
      tax_id: "",
      payment_terms_days: "",
      relationship_status: "past",
      lead_source: "LinkedIn",
      preferred_contact_method: "email",
      timezone: "Europe/London",
      tags: "brand, dormant",
      notes: "Good fit for future launch campaigns.",
    },
  },
};
