import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { FinanceInvoiceRow } from "@/lib/finance/types";

import { FinanceInvoiceTable } from "./finance-invoice-table";

const base = {
  user_id: "u1",
  project_id: null,
  content_json: { type: "doc" },
  pdf_url: null,
  sent_at: null,
  viewed_at: null,
  signed_at: null,
  payment_terms: null,
  notes_footer: null,
  paid_at: null,
  pay_token: null,
  discount_value: 0,
  discount_type: "percent" as const,
  quote_number: null,
  proposal_number: null,
  valid_until: null,
  approval_token: null,
  approved_at: null,
  declined_at: null,
  approval_message: null,
  receipt_number: null,
  source_document_id: null,
  payment_id: null,
  lpo_number: null,
  lpo_validity_date: null,
  lpo_amount: null,
  lpo_pdf_url: null,
  lpo_reference_number: null,
  currency: "AED",
  issued_at: null,
  updated_at: "2026-05-20T10:00:00Z",
  project: null,
  total_amount: null,
};

const invoices: FinanceInvoiceRow[] = [
  {
    ...base,
    id: "i1",
    client_id: "c1",
    type: "invoice",
    status: "paid",
    title: "Brand Refresh — May",
    invoice_number: "INV-0042",
    due_date: "2026-06-15",
    created_at: "2026-05-15T10:00:00Z",
    client: { id: "c1", name: "Acme Design Co.", currency: "AED" },
    computedTotal: 9975,
  } as FinanceInvoiceRow,
  {
    ...base,
    id: "i2",
    client_id: "c2",
    type: "invoice",
    status: "sent",
    title: "Maintenance Retainer",
    invoice_number: "INV-0043",
    due_date: "2026-06-01",
    created_at: "2026-05-18T10:00:00Z",
    client: { id: "c2", name: "Zenith Studio", currency: "GBP" },
    computedTotal: 3500,
  } as FinanceInvoiceRow,
  {
    ...base,
    id: "i3",
    client_id: "c1",
    type: "invoice",
    status: "sent",
    title: "Backend Sprint",
    invoice_number: "INV-0040",
    due_date: "2026-05-01",
    created_at: "2026-04-01T10:00:00Z",
    client: { id: "c1", name: "Acme Design Co.", currency: "AED" },
    computedTotal: 7200,
  } as FinanceInvoiceRow,
];

const meta: Meta<typeof FinanceInvoiceTable> = {
  title: "Features/Finance/FinanceInvoiceTable",
  component: FinanceInvoiceTable,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof FinanceInvoiceTable>;

const filtersBase = {
  dateRange: { from: new Date("2026-01-01"), to: new Date("2026-12-31") },
  pageSize: 20,
  sort: "date_desc" as const,
};

export const Default: Story = {
  args: {
    invoices,
    total: invoices.length,
    pageCount: 1,
    currentPage: 1,
    currentSort: "date_desc",
    currency: "AED",
    filters: filtersBase,
  },
};

export const Empty: Story = {
  args: {
    invoices: [],
    total: 0,
    pageCount: 1,
    currentPage: 1,
    currentSort: "date_desc",
    currency: "AED",
    filters: filtersBase,
  },
};
