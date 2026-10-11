import type { Meta, StoryObj } from "@storybook/react";
import { RecurringInvoicesTable } from "./recurring-invoices-table";
import type { RecurringInvoiceListRow } from "@/types";

const mockSchedules: RecurringInvoiceListRow[] = [
  {
    id: "rec-1",
    user_id: "user-1",
    client_id: "client-1",
    project_id: null,
    title: "Acme monthly retainer",
    status: "active",
    interval: "monthly",
    interval_count: 1,
    start_date: "2026-07-01",
    next_run_at: "2026-07-01",
    last_run_at: null,
    end_date: null,
    occurrences_limit: null,
    auto_send: false,
    net_days: 7,
    currency: "USD",
    tax_mode: "none",
    tax_rate: 0,
    discount_type: "percent",
    discount_value: 0,
    notes_footer: null,
    payment_terms: null,
    line_items: [
      {
        description: "Monthly design retainer",
        quantity: 1,
        unit_price: 2500,
        tax_rate: 0,
      },
    ],
    occurrences_count: 0,
    source_document_id: null,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    client: { id: "client-1", name: "Acme Corp" },
  },
];

const meta: Meta<typeof RecurringInvoicesTable> = {
  title: "features/finance/RecurringInvoicesTable",
  component: RecurringInvoicesTable,
  parameters: {
    docs: {
      description: {
        component:
          "Lists recurring billing schedules with cadence, amount, next run, and row actions.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RecurringInvoicesTable>;

export const WithSchedules: Story = {
  args: { schedules: mockSchedules },
};

export const Empty: Story = {
  args: { schedules: [] },
};
