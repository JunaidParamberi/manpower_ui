import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import type { TiptapDoc } from "@/types";
import { ApprovalRail } from "../approval-rail";
import { CLIENTS, CTX, LINES, PROJECTS, SERVICES } from "../story-fixtures";
import { ProposalEditor, type ProposalEditorProps } from "./proposal-editor";

/**
 * The proposal page: a cover, the pitch as rich text, and pricing, all on the paper. Autosaves every change.
 * Once sent, the text and cover stay editable but pricing locks. Use for proposals only.
 */
const meta: Meta<typeof ProposalEditor> = {
  title: "Features/Documents/Workspace/ProposalEditor",
  component: ProposalEditor,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="flex h-[860px] flex-col bg-[var(--panel)]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ProposalEditor>;

const BODY: TiptapDoc = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "The opportunity" }] },
    { type: "paragraph", content: [{ type: "text", text: "Acme Studio is relaunching its brand in Q1. We would own identity, the marketing site and the design system, so the team ships once and ships consistently." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "How we would work" }] },
    { type: "bulletList", content: [
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Week 1: discovery and brand audit" }] }] },
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Weeks 2 to 4: identity and design system" }] }] },
    ] },
  ],
} as TiptapDoc;

const ReadPaper = () => (
  <div className="sheet !w-full !min-h-0">
    <div className="doc-header">
      <div className="doc-header__org">Junaid Studio</div>
      <div className="doc-header__right"><div className="doc-type">Proposal</div><div className="doc-type-sub">PRO-0007</div></div>
    </div>
    <p className="dim">The finished proposal, rendered by the existing sheet.</p>
  </div>
);

const base: ProposalEditorProps = {
  mode: "edit",
  fresh: false,
  documentTitle: "Proposal for Acme Studio",
  documentId: "pr1",
  backHref: "/documents/proposals",
  backLabel: "Proposals",
  status: "draft",
  statusLabel: "Draft",
  statusTone: "neutral",
  canEditContent: true,
  canSwitchToEdit: false,
  editHref: "/documents/pr1?edit=1",
  readHref: "/documents/pr1",
  today: "2026-10-09",
  actionsEdit: <Button size="sm">Send</Button>,
  actionsRead: <Button size="sm">Send</Button>,
  variableContext: CTX,
  meta: {
    proposal_number: "PRO-0007", issued: "2026-10-09", valid_until: "2026-11-08", notes_footer: "50% deposit to start. Balance on delivery.", currency: "AED",
    discount_value: 0, discount_type: "percent",
    proposal_content: { headline: "A brand Acme can grow into", headline_accent: "grow", subhead: "Identity, site and design system in six weeks", investment_range: "AED 20 to 25k" },
  },
  contentJson: BODY,
  lineItems: LINES,
  clientId: "c1",
  projectId: "p1",
  clients: CLIENTS,
  projects: PROJECTS,
  services: SERVICES,
  readPaper: <ReadPaper />,
};

export const Draft: Story = { args: base };
export const SentPricingLocked: Story = {
  args: { ...base, status: "sent", statusLabel: "Sent", statusTone: "accent", canSwitchToEdit: true, editingSentNote: "This proposal has been sent. You can change the text and cover; pricing is locked." },
};
export const ApprovedRead: Story = {
  args: {
    ...base,
    mode: "read",
    status: "approved",
    statusLabel: "Approved",
    statusTone: "success",
    canEditContent: false,
    approvalRail: <ApprovalRail documentId="pr1" kind="proposal" status="approved" approvedAt="2026-10-06T10:00:00Z" declinedAt={null} approvalMessage="Let's go." approvalUrl={null} clientId="c1" hasProject={false} />,
  },
};
