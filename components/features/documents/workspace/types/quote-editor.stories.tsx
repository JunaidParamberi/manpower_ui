import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import { ApprovalRail } from "../approval-rail";
import { CLIENTS, CTX, LINES, PROJECTS, SERVICES } from "../story-fixtures";
import { QuoteEditor, type QuoteEditorProps } from "./quote-editor";

/**
 * The quote page: an editable paper with a settings rail while it is a draft, the finished read-only
 * quote once sent, with approval status in the rail. Autosaves every change; Done returns to the read view.
 * Use for quotes only.
 */
const meta: Meta<typeof QuoteEditor> = {
  title: "Features/Documents/Workspace/QuoteEditor",
  component: QuoteEditor,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="flex h-[760px] flex-col bg-[var(--panel)]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof QuoteEditor>;

const ReadPaper = () => (
  <div className="sheet !w-full !min-h-0">
    <div className="doc-header">
      <div className="doc-header__org">Junaid Studio</div>
      <div className="doc-header__right"><div className="doc-type">Quote</div><div className="doc-type-sub">QUO-0018</div></div>
    </div>
    <p className="dim">The finished quote, rendered by the existing sheet (same as the PDF).</p>
  </div>
);

const base: QuoteEditorProps = {
  mode: "edit",
  fresh: false,
  documentTitle: "Quote for Acme Studio",
  documentId: "q1",
  backHref: "/documents/quotes",
  backLabel: "Quotes",
  status: "draft",
  statusLabel: "Draft",
  statusTone: "neutral",
  canEditContent: true,
  canSwitchToEdit: false,
  editHref: "/documents/q1?edit=1",
  readHref: "/documents/q1",
  today: "2026-10-09",
  actionsEdit: <Button size="sm">Send</Button>,
  actionsRead: <Button size="sm">Send</Button>,
  variableContext: CTX,
  meta: {
    quote_number: "QUO-0018", issued: "2026-10-09", valid_until: null, notes_footer: "Valid for 30 days. 50% deposit to start.",
    currency: "AED", fx_rate: null, discount_value: 0, discount_type: "percent", tax_mode: "vat", tax_rate: 5,
  },
  lineItems: LINES,
  clientId: "c1",
  projectId: "p1",
  clients: CLIENTS,
  projects: PROJECTS,
  services: SERVICES,
  readPaper: <ReadPaper />,
};

export const DraftMissingDate: Story = { args: base };
export const DraftReady: Story = { args: { ...base, meta: { ...base.meta, valid_until: "2026-11-08" } } };
export const SentWaiting: Story = {
  args: {
    ...base,
    mode: "read",
    status: "sent",
    statusLabel: "Sent",
    statusTone: "accent",
    canEditContent: false,
    canSwitchToEdit: true,
    meta: { ...base.meta, valid_until: "2026-11-08" },
    sentParts: ["Sent to sara@acme.studio on 2 Oct", "viewed 3 Oct"],
    approvalRail: <ApprovalRail documentId="q1" kind="quote" status="sent" approvedAt={null} declinedAt={null} approvalMessage={null} approvalUrl="https://app.manpower.com/quote/abc123" />,
  },
};
export const Approved: Story = {
  args: {
    ...base,
    mode: "read",
    status: "approved",
    statusLabel: "Approved",
    statusTone: "success",
    canEditContent: false,
    meta: { ...base.meta, valid_until: "2026-11-08" },
    approvalRail: <ApprovalRail documentId="q1" kind="quote" status="approved" approvedAt="2026-10-06T10:00:00Z" declinedAt={null} approvalMessage="Looks good. Let's start Monday." approvalUrl={null} />,
  },
};
