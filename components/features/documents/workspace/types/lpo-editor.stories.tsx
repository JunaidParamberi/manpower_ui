import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import { LpoBillingRail } from "../lpo-billing-rail";
import { CLIENTS, CTX, LINES, PROJECTS, SERVICES } from "../story-fixtures";
import { LpoEditor, type LpoEditorProps } from "./lpo-editor";

/**
 * The purchase order page: the order your client sent you, with its number, validity, amount ceiling and
 * ordered items, plus billing progress against the ceiling. Use for LPOs only.
 */
const meta: Meta<typeof LpoEditor> = {
  title: "Features/Documents/Workspace/LpoEditor",
  component: LpoEditor,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="flex h-[760px] flex-col bg-[var(--panel)]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof LpoEditor>;

const ReadPaper = () => (
  <div className="sheet !w-full !min-h-0">
    <div className="doc-header">
      <div className="doc-header__org">Junaid Studio</div>
      <div className="doc-header__right"><div className="doc-type">Purchase order</div><div className="doc-type-sub">LPO-2026-118</div></div>
    </div>
    <p className="dim">The finished purchase order, rendered by the existing sheet.</p>
  </div>
);

const base: LpoEditorProps = {
  mode: "edit",
  fresh: false,
  documentTitle: "LPO-2026-118",
  documentId: "lpo1",
  backHref: "/documents/purchase-orders",
  backLabel: "Purchase orders",
  status: "draft",
  statusLabel: "Draft",
  statusTone: "neutral",
  canEditContent: true,
  canSwitchToEdit: false,
  editHref: "/documents/lpo1?edit=1",
  readHref: "/documents/lpo1",
  today: "2026-10-09",
  actionsEdit: <Button size="sm">Send</Button>,
  actionsRead: <Button size="sm">Send</Button>,
  variableContext: CTX,
  meta: {
    lpo_number: "LPO-2026-118", issued: "2026-10-09", lpo_validity_date: "2026-12-31", lpo_amount: 20000, payment_terms: "Net 30",
    currency: "AED", discount_value: 0, discount_type: "percent", tax_mode: "none", tax_rate: 0,
  },
  lineItems: LINES,
  clientId: "c1",
  projectId: "p1",
  clients: CLIENTS,
  projects: PROJECTS,
  services: SERVICES,
  pdfUrl: null,
  readPaper: <ReadPaper />,
};

export const Draft: Story = { args: base };
export const NoNumberYet: Story = { args: { ...base, meta: { ...base.meta, lpo_number: "", lpo_amount: null } } };
export const ActiveWithInvoices: Story = {
  args: {
    ...base,
    mode: "read",
    status: "sent",
    statusLabel: "Sent",
    statusTone: "accent",
    canEditContent: false,
    pdfUrl: "https://example.com/lpo.pdf",
    billingRail: (
      <LpoBillingRail
        documentId="lpo1"
        currency="AED"
        progress={{ lpo_amount: 20000, invoiced_amount: 10000, paid_amount: 4000, invoiced_pct: 50, paid_pct: 20, over_ceiling: false }}
        linkedInvoices={[{ id: "i1", title: "Invoice", invoice_number: "INV-0040", status: "partially_paid" }]}
        pdfUrl="https://example.com/lpo.pdf"
      />
    ),
  },
};
