import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ApprovalRail } from "./approval-rail";

/**
 * Where a sent quote or proposal stands with the client: waiting (with the approval link), approved
 * (with next steps for a quote) or declined. Use in the document rail once it has been sent. Not for drafts.
 */
const meta: Meta<typeof ApprovalRail> = {
  title: "Features/Documents/Workspace/ApprovalRail",
  component: ApprovalRail,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-[300px] bg-[var(--panel)]"><Story /></div>],
  args: { documentId: "q1", kind: "quote", approvedAt: null, declinedAt: null, approvalMessage: null, approvalUrl: "https://app.manpower.com/quote/abc123" },
};
export default meta;
type Story = StoryObj<typeof ApprovalRail>;

export const Waiting: Story = { args: { status: "sent" } };
export const Approved: Story = { args: { status: "approved", approvedAt: "2026-10-06T10:00:00Z", approvalMessage: "Looks good. Let's start Monday." } };
export const Declined: Story = { args: { status: "declined", declinedAt: "2026-10-06T10:00:00Z", approvalMessage: "Budget moved to next quarter." } };
export const ApprovedProposal: Story = { args: { kind: "proposal", status: "approved", approvedAt: "2026-10-06T10:00:00Z" } };
