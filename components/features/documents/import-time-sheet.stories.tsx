import type { Meta, StoryObj } from "@storybook/react";

import type { ProjectListRow } from "@/types";

import { ImportTimeSheet } from "./import-time-sheet";

const mockProjects: ProjectListRow[] = [
  {
    id: "proj-1",
    user_id: "user-1",
    client_id: "client-1",
    title: "Website Redesign",
    status: "active",
    budget: 5000,
    spent: 1200,
    hourly_rate: 150,
    start_date: "2026-06-01",
    deadline: "2026-07-31",
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    client: { id: "client-1", name: "Acme Corp" },
  },
  {
    id: "proj-2",
    user_id: "user-1",
    client_id: "client-2",
    title: "Mobile App",
    status: "active",
    budget: null,
    spent: null,
    hourly_rate: null,
    start_date: null,
    deadline: null,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    client: { id: "client-2", name: "Beta Ltd" },
  },
];

const meta: Meta<typeof ImportTimeSheet> = {
  title: "Features/Documents/ImportTimeSheet",
  component: ImportTimeSheet,
  parameters: {
    docs: {
      description: {
        component:
          "Sheet triggered from the invoice line items editor. Lets the freelancer select a project and date range, preview unbilled time grouped by day, set an hourly rate, and insert lines into the draft invoice.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ImportTimeSheet>;

export const WithProjects: Story = {
  args: {
    invoiceId: "inv-00000000-0000-0000-0000-000000000001",
    invoiceClientId: "client-1",
    projects: mockProjects,
    currency: "USD",
  },
};

export const NoRate: Story = {
  args: {
    invoiceId: "inv-00000000-0000-0000-0000-000000000001",
    invoiceClientId: "client-2",
    projects: mockProjects,
    currency: "GBP",
  },
};

export const NoProjects: Story = {
  args: {
    invoiceId: "inv-00000000-0000-0000-0000-000000000001",
    invoiceClientId: "client-99",
    projects: [],
    currency: "USD",
  },
};
