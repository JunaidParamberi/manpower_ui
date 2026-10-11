import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import { SaveIndicator } from "./save-indicator";
import { WorkspaceHeader } from "./workspace-header";

/**
 * The top bar of a document: back link, number, status, save state and actions.
 * Use for every document type in both the edit and read view. Not for list pages: use PageHeader.
 */
const meta: Meta<typeof WorkspaceHeader> = {
  title: "Features/Documents/Workspace/WorkspaceHeader",
  component: WorkspaceHeader,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { backHref: "/documents/invoices", backLabel: "Invoices", title: "INV-0042" },
};
export default meta;
type Story = StoryObj<typeof WorkspaceHeader>;

export const DraftEditing: Story = {
  args: {
    statusLabel: "Draft",
    statusTone: "neutral",
    save: <SaveIndicator status="saved" error={null} onRetry={() => {}} />,
    actions: (<><Button size="sm" variant="outline">New invoice</Button><Button size="sm" variant="outline">Done</Button><Button size="sm">Send</Button></>),
  },
};
export const SentRead: Story = {
  args: {
    title: "INV-0041",
    statusLabel: "Partly paid",
    statusTone: "warning",
    actions: (<><Button size="sm" variant="outline">Edit</Button><Button size="sm">Record payment</Button></>),
  },
};
export const Voided: Story = { args: { statusLabel: "Voided", statusTone: "danger", actions: null } };
export const Narrow: Story = {
  args: DraftEditing.args,
  decorators: [(Story) => <div className="max-w-[390px]"><Story /></div>],
};
