import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { DocumentListRow } from "@/types";
import { ClientDocumentsSection } from "./client-documents-section";

function doc(overrides: Partial<DocumentListRow>): DocumentListRow {
  return {
    id: "doc-1",
    user_id: "u1",
    client_id: "c1",
    project_id: null,
    type: "invoice",
    title_is_auto: false,
    status: "sent",
    title: "Invoice",
    content_json: { type: "doc" },
    pdf_url: null,
    sent_at: null,
    viewed_at: null,
    signed_at: null,
    invoice_number: null,
    due_date: null,
    payment_terms: null,
    notes_footer: null,
    paid_at: null,
    pay_token: null,
    discount_value: 0,
    discount_type: "flat",
    quote_number: null,
    proposal_number: null,
    valid_until: null,
    approval_token: null,
    client: { id: "c1", name: "Al Noor Interiors", currency: "AED" },
    project: null,
    total_amount: 0,
    ...overrides,
  } as DocumentListRow;
}

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const mixed = [
  doc({ id: "1", invoice_number: "INV-0042", project: { id: "p1", title: "Villa Jumeirah fit-out" }, due_date: inDays(-9), total_amount: 6400 }),
  doc({ id: "2", type: "quote", quote_number: "QT-0019", project: { id: "p2", title: "Showroom brand refresh" }, total_amount: 9800 }),
  doc({ id: "3", invoice_number: "INV-0038", status: "paid", project: { id: "p1", title: "Villa Jumeirah fit-out" }, total_amount: 12000 }),
  doc({ id: "4", type: "receipt", receipt_number: "RCT-0038", status: "draft", title: "Receipt for INV-0038", total_amount: 12000 }),
];

/** A client's documents as flush rows: type tile, number, project, status pill, amount. Used on the client Overview (open only) and the Documents tab. Not the documents page list. */
const meta: Meta<typeof ClientDocumentsSection> = {
  title: "Features/Clients/ClientDocumentsSection",
  component: ClientDocumentsSection,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  decorators: [(Story) => <div className="max-w-[640px] bg-[var(--panel)] pb-4"><Story /></div>],
  args: { clientId: "c1", currency: "AED" },
};
export default meta;
type Story = StoryObj<typeof ClientDocumentsSection>;

export const Mixed: Story = { args: { documents: mixed } };
export const OverviewOpenOnly: Story = { args: { title: "Open documents", documents: mixed.slice(0, 2), viewAllHref: "/clients/c1?tab=documents" } };
export const Empty: Story = { args: { documents: [] } };
export const LongValues: Story = {
  args: { documents: [doc({ id: "9", invoice_number: "INV-2026-000412", project: { id: "p9", title: "Qasr Al Hosn Hospitality Group full rebrand and signage" }, due_date: inDays(-112), total_amount: 1240000 })] },
};
