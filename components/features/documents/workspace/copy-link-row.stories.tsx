import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CopyLinkRow } from "./copy-link-row";

/**
 * A link with a copy button in the document rail, for the pay link and the approval link.
 * Use when the client needs a URL from you. Not for navigation: use a normal link.
 */
const meta: Meta<typeof CopyLinkRow> = {
  title: "Features/Documents/Workspace/CopyLinkRow",
  component: CopyLinkRow,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-[300px] bg-[var(--panel)] p-3"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof CopyLinkRow>;

export const PayLink: Story = { args: { label: "Pay link", url: "https://app.manpower.com/pay/9f2c1a7e" } };
export const ApprovalLink: Story = { args: { label: "Approval link", url: "https://app.manpower.com/proposal/abc123" } };
