import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ClientRow } from "@/types";
import { ProjectForm } from "./project-form";

const clients: ClientRow[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "99999999-9999-4999-8999-999999999999",
    name: "Atlas Creative",
    contact_name: "Richard Hammond",
    website: "https://atlascreative.co.uk",
    email: "james@atlascreative.co.uk",
    billing_email: "accounts@atlascreative.co.uk",
    phone: "+44 20 7946 0854",
    company: "Atlas Creative Ltd",
    address: "London, UK",
    currency: "GBP",
    tax_id: "GB123456789",
    payment_terms_days: 30,
    relationship_status: "active",
    lead_source: "Referral",
    preferred_contact_method: "email",
    timezone: "Europe/London",
    tags: ["retainer", "creative"],
    notes: "Monthly design support.",
    health_score: 86,
    portal_token: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    user_id: "99999999-9999-4999-8999-999999999999",
    name: "Northstar Studio",
    contact_name: "Maya Chen",
    website: null,
    email: "maya@northstar.example",
    billing_email: null,
    phone: null,
    company: null,
    address: null,
    currency: "USD",
    tax_id: null,
    payment_terms_days: null,
    relationship_status: "lead",
    lead_source: "LinkedIn",
    preferred_contact_method: "email",
    timezone: "America/New_York",
    tags: ["brand"],
    notes: null,
    health_score: null,
    portal_token: null,
    created_at: "2026-01-02T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
  },
];

const meta: Meta<typeof ProjectForm> = {
  title: "Features/Projects/ProjectForm",
  component: ProjectForm,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Create and edit project records in a launch-board workspace. Use it when client, budget, and timeline choices benefit from live context; avoid it for small inline edits.",
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
type Story = StoryObj<typeof ProjectForm>;

export const Create: Story = {
  args: {
    mode: "create",
    clients,
    defaultValues: {
      client_id: clients[0].id,
      title: "",
      status: "planning",
      budget: "",
      spent: "",
      start_date: "",
      deadline: "",
    },
  },
};

export const EditWithBudgetAndTimeline: Story = {
  args: {
    mode: "edit",
    projectId: "33333333-3333-4333-8333-333333333333",
    clients,
    defaultValues: {
      client_id: clients[0].id,
      title: "Website relaunch",
      status: "active",
      budget: "12000",
      spent: "3600",
      start_date: "2026-06-01",
      deadline: "2026-07-15",
    },
  },
};

export const NoClients: Story = {
  args: {
    mode: "create",
    clients: [],
  },
};
