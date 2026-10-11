import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import { RailField } from "../rail/rail-field";
import { RailSection } from "../rail/rail-section";
import { ReadOnlyWorkspace } from "./read-only-workspace";

/**
 * A document that is only ever read, such as a receipt: the same page and rail, with no editing.
 * Use for receipts. Not for documents a person can change: use the editors.
 */
const meta: Meta<typeof ReadOnlyWorkspace> = {
  title: "Features/Documents/Workspace/ReadOnlyWorkspace",
  component: ReadOnlyWorkspace,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="flex h-[640px] flex-col bg-[var(--panel)]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ReadOnlyWorkspace>;

export const Receipt: Story = {
  args: {
    documentId: "r1",
    backHref: "/documents/receipts",
    backLabel: "Receipts",
    title: "RCT-0012",
    status: "paid",
    statusLabel: "Paid",
    statusTone: "success",
    readHref: "/documents/r1",
    today: "2026-10-09",
    actionsRead: <Button size="sm" variant="outline">PDF</Button>,
    readPaper: <div className="sheet !w-full !min-h-0"><p>The receipt, rendered by the existing sheet.</p></div>,
    rail: (
      <RailSection title="Payment">
        <RailField label="Amount" disabled>AED 5,000.00</RailField>
        <RailField label="Method" disabled>bank transfer</RailField>
        <RailField label="Reference" disabled>ENBD-88421</RailField>
      </RailSection>
    ),
  },
};
