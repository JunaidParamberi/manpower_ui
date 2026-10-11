import type { Meta, StoryObj } from "@storybook/react";

import type { RecurringInvoiceRow } from "@/types";

import { InvoiceRecurringSection } from "./invoice-recurring-section";

const mockSchedule: RecurringInvoiceRow = {
  id: "rec-1",
  user_id: "user-1",
  client_id: "client-1",
  project_id: null,
  title: "Monthly retainer",
  status: "active",
  interval: "monthly",
  interval_count: 1,
  start_date: "2026-07-01",
  next_run_at: "2026-08-01",
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
      description: "Retainer",
      notes: null,
      quantity: 1,
      unit_price: 2000,
      tax_rate: 0,
      hsn_sac_code: null,
    },
  ],
  occurrences_count: 1,
  source_document_id: "doc-1",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

const meta: Meta<typeof InvoiceRecurringSection> = {
  title: "Features/Documents/InvoiceRecurringSection",
  component: InvoiceRecurringSection,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Inline recurring billing controls on the invoice editor sidebar. Toggle a schedule, pick frequency and start date, and optionally auto-send future generated invoices. Generated invoices show a read-only link to the parent schedule.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm rounded-lg border border-border/70 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InvoiceRecurringSection>;

export const Off: Story = {
  args: {
    documentId: "doc-1",
    invoiceStatus: "draft",
    hasClient: true,
    hasLineItems: true,
    initialSchedule: null,
    generatedFromScheduleId: null,
  },
};

export const OnWithSchedule: Story = {
  args: {
    documentId: "doc-1",
    invoiceStatus: "draft",
    hasClient: true,
    hasLineItems: true,
    initialSchedule: mockSchedule,
    generatedFromScheduleId: null,
  },
};

export const AutoSendEnabled: Story = {
  args: {
    ...OnWithSchedule.args,
    initialSchedule: { ...mockSchedule, auto_send: true },
  },
};

export const GeneratedInvoice: Story = {
  args: {
    documentId: "doc-2",
    invoiceStatus: "sent",
    hasClient: true,
    hasLineItems: true,
    initialSchedule: null,
    generatedFromScheduleId: "rec-1",
  },
};

export const DisabledNoClient: Story = {
  args: {
    documentId: "doc-1",
    invoiceStatus: "draft",
    hasClient: false,
    hasLineItems: true,
    initialSchedule: null,
    generatedFromScheduleId: null,
  },
};

export const DisabledNoLineItems: Story = {
  args: {
    documentId: "doc-1",
    invoiceStatus: "draft",
    hasClient: true,
    hasLineItems: false,
    initialSchedule: null,
    generatedFromScheduleId: null,
  },
};
