import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { DocumentListRow } from "@/types";

import { DocumentsTable } from "./documents-table";

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
};

const acme = { id: "c1", name: "Acme Design Co.", currency: "AED" };
const zenith = { id: "c2", name: "Zenith Studio", currency: "GBP" };

const docs = [
  {
    ...base,
    id: "d1",
    client_id: "c1",
    type: "invoice",
    status: "sent",
    title: "Brand Refresh — May",
    invoice_number: "INV-0042",
    due_date: "2026-06-15",
    created_at: "2026-05-15T10:00:00Z",
    total_amount: 9975,
    client: acme,
  },
  {
    ...base,
    id: "d2",
    client_id: "c2",
    type: "quote",
    status: "approved",
    title: "E-commerce Platform",
    invoice_number: null,
    quote_number: "QUO-0012",
    due_date: null,
    created_at: "2026-05-12T08:00:00Z",
    total_amount: 25000,
    client: zenith,
  },
  {
    ...base,
    id: "d3",
    client_id: "c1",
    type: "invoice",
    status: "sent",
    title: "Maintenance Retainer — April",
    invoice_number: "INV-0040",
    due_date: "2026-05-01",
    created_at: "2026-04-01T10:00:00Z",
    total_amount: 3500,
    client: acme,
  },
  {
    ...base,
    id: "d4",
    client_id: "c2",
    type: "proposal",
    status: "draft",
    title: "Marketing Site Proposal",
    invoice_number: null,
    proposal_number: "PRO-0007",
    due_date: null,
    created_at: "2026-05-22T15:00:00Z",
    total_amount: null,
    client: zenith,
  },
] as unknown as DocumentListRow[];

const meta: Meta<typeof DocumentsTable> = {
  title: "Features/Documents/DocumentsTable",
  component: DocumentsTable,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof DocumentsTable>;

export const Default: Story = { args: { documents: docs } };

export const Empty: Story = { args: { documents: [] } };
