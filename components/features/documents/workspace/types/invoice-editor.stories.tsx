import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import { CLIENTS, CTX, LINES, PROJECTS, SERVICES } from "../story-fixtures";
import { InvoiceBalanceRail } from "../invoice-balance-rail";
import { InvoiceEditor, type InvoiceEditorProps } from "./invoice-editor";

/**
 * The invoice page: an editable paper with a settings rail while it is a draft, the finished
 * read-only invoice once sent. Autosaves every change; Done returns to the read view.
 * Use for invoices only. Quotes, proposals and LPOs have their own editors on the same frame.
 */
const meta: Meta<typeof InvoiceEditor> = {
  title: "Features/Documents/Workspace/InvoiceEditor",
  component: InvoiceEditor,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="flex h-[760px] flex-col bg-[var(--panel)]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof InvoiceEditor>;

const ReadPaper = () => (
  <div className="sheet !w-full !min-h-0">
    <div className="doc-header">
      <div className="doc-header__org">Junaid Studio</div>
      <div className="doc-header__right"><div className="doc-type">Invoice</div><div className="doc-type-sub">INV-0041</div></div>
    </div>
    <p className="dim">The finished invoice, rendered by the existing sheet (same as the PDF).</p>
  </div>
);

const base: InvoiceEditorProps = {
  mode: "edit",
  fresh: false,
  documentTitle: "Invoice for Acme Studio",
  documentId: "d1",
  backHref: "/documents/invoices",
  backLabel: "Invoices",
  status: "draft",
  statusLabel: "Draft",
  statusTone: "neutral",
  canEditContent: true,
  canSwitchToEdit: false,
  editHref: "/documents/d1?edit=1",
  readHref: "/documents/d1",
  today: "2026-10-09",
  actionsEdit: <Button size="sm">Send</Button>,
  actionsRead: <Button size="sm">Record payment</Button>,
  variableContext: CTX,
  meta: {
    invoice_number: "INV-0042", issued: "2026-10-09", due_date: null, payment_terms: null, notes_footer: "Thank you for the work together this month.",
    lpo_reference_number: null, currency: "AED", fx_rate: null, discount_value: 0, discount_type: "percent", tax_mode: "vat", tax_rate: 5, tds_enabled: false, tds_rate: 0,
  },
  lineItems: LINES,
  clientId: "c1",
  projectId: "p1",
  clients: CLIENTS,
  projects: PROJECTS,
  services: SERVICES,
  recurringSchedule: null,
  generatedFromScheduleId: null,
  hasTdsCertificate: false,
  defaultTdsRate: 10,
  readPaper: <ReadPaper />,
};

export const DraftEditing: Story = { args: base };

export const NewFromClient: Story = {
  args: {
    ...base,
    fresh: true,
    lineItems: [],
    meta: { ...base.meta, due_date: "2026-11-08", payment_terms: "Net 30" },
    banner: { clientName: "Acme Studio", clientColor: "var(--chart-1)", filled: ["client", "project", "AED", "Net 30 due date"] },
  },
};

export const SentReadOnly: Story = {
  args: {
    ...base,
    mode: "read",
    status: "partially_paid",
    statusLabel: "Partly paid",
    statusTone: "warning",
    canEditContent: false,
    canSwitchToEdit: false,
    meta: { ...base.meta, due_date: "2026-11-01", payment_terms: "Net 30" },
    sentParts: ["Sent to sara@acme.studio on 2 Oct", "viewed 3 Oct", "AED 5,000 paid"],
    balanceRail: (
      <InvoiceBalanceRail
        balance={{ invoiceTotal: 13440, totalPaid: 5000, totalWrittenOff: 0, balanceDue: 8440 }}
        payments={[]}
        currency="AED"
        homeCurrency="AED"
        voucherByPaymentId={{}}
        payUrl="https://app.manpower.com/pay/abc123"
      />
    ),
  },
};

/** Editing a sent invoice: content is locked because the server only accepts edits on drafts. */
export const EditingSent: Story = {
  args: {
    ...base,
    mode: "edit",
    status: "sent",
    statusLabel: "Sent",
    statusTone: "accent",
    canEditContent: false,
    canSwitchToEdit: true,
    meta: { ...base.meta, due_date: "2026-11-01", payment_terms: "Net 30" },
    editingSentNote: "Editing a sent invoice. Your client sees changes when you resend.",
  },
};
