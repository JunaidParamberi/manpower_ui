import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ClientOverviewRow } from "@/lib/clients/clients-overview-queries";

import { ClientsListPane } from "./clients-list-pane";

function makeClient(overrides: Partial<ClientOverviewRow> = {}): ClientOverviewRow {
  return {
    id: "client-1",
    user_id: "user-1",
    name: "Nova Retail FZ",
    contact_name: "Sara Khalid",
    website: null,
    email: "nova@example.test",
    billing_email: null,
    phone: null,
    company: "Nova Retail FZ-LLC",
    address: "Dubai, UAE",
    currency: "AED",
    tax_id: null,
    payment_terms_days: null,
    relationship_status: "active",
    lead_source: "referral",
    preferred_contact_method: null,
    timezone: null,
    tags: ["retail"],
    notes: null,
    health_score: 72,
    portal_token: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    projects_count: 0,
    revenue_total: 0,
    last_activity_at: new Date().toISOString(),
    recent_documents: [],
    outstanding_total: 0,
    overdue_total: 0,
    overdue_days: 0,
    next_due_date: null,
    ...overrides,
  } as ClientOverviewRow;
}

const NOW = "2026-10-09T10:00:00.000Z";

const manyClients: ClientOverviewRow[] = [
  makeClient({ id: "1", name: "Al Noor Interiors", contact_name: "Mariam Al Suwaidi", company: null, address: "Dubai", health_score: 58, outstanding_total: 6400, overdue_total: 6400, overdue_days: 9, next_due_date: "2026-09-30" }),
  makeClient({ id: "2", name: "Bramble & Co", contact_name: "Tom Hale", company: null, address: "Bristol, UK", currency: "GBP", health_score: 64, outstanding_total: 1200, next_due_date: "2026-10-10" }),
  makeClient({ id: "3", name: "Northwind Studio", contact_name: "Priya Nair", health_score: 91 }),
  makeClient({ id: "4", name: "Qasr Hospitality", contact_name: "Omar Haddad", health_score: 88, outstanding_total: 12000, next_due_date: "2026-10-23" }),
  makeClient({ id: "5", name: "Lumen Labs", contact_name: "Sara Kim", currency: "USD", health_score: 84 }),
  makeClient({ id: "6", name: "Tide & Timber", contact_name: "Noah Reed", health_score: 86, last_activity_at: "2026-06-01T00:00:00.000Z" }),
  makeClient({ id: "7", name: "Fennel Kitchen", contact_name: "Ella Moss", health_score: null }),
];

const meta: Meta<typeof ClientsListPane> = {
  title: "Features/Clients/ClientsListPane",
  component: ClientsListPane,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    docs: {
      description: {
        component:
          "Left pane of the clients section: title and summary, search, Needs you / Healthy / Gone quiet lenses, and rows grouped by lens with the amount owed and health ring. Use only inside ClientsShell beside the client detail. Not for picking a client in a form: use the client combobox.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="flex h-[640px] w-[360px] border-r border-border bg-[var(--panel)]">
        <Story />
      </div>
    ),
  ],
  args: {
    defaultCurrency: "AED",
    atLimit: false,
    planTier: "free",
    clientLimit: 3,
    revenueLabel: "AED 214,000.00 lifetime",
    nowIso: NOW,
  },
};

export default meta;
type Story = StoryObj<typeof ClientsListPane>;

export const Default: Story = { args: { clients: manyClients } };

export const SingleClient: Story = { args: { clients: [manyClients[2]] } };

export const NoMatches: Story = {
  args: { clients: manyClients },
  parameters: { nextjs: { appDirectory: true, navigation: { query: { q: "zzz" } } } },
};

export const LongValues: Story = {
  args: {
    clients: [
      makeClient({
        id: "long",
        name: "Qasr Al Hosn Hospitality Group LLC",
        contact_name: "Abdulrahman Al Mansoori",
        company: "Qasr Al Hosn Hospitality Group LLC",
        health_score: 41,
        outstanding_total: 1240000,
        overdue_total: 1240000,
        overdue_days: 112,
        next_due_date: "2026-06-19",
      }),
      ...manyClients,
    ],
  },
};

export const Empty: Story = { args: { clients: [] } };

export const AtLimit: Story = { args: { clients: manyClients, atLimit: true } };
