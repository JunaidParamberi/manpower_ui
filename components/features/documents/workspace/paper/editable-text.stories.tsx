import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { EditableText } from "./editable-text";

/**
 * Plain text you edit in place on the paper. Shows a dashed outline on hover and an accent ring on focus.
 * Use for the document number, line descriptions, notes and payment details.
 * Not for rich formatting (use the proposal editor) or for numbers (use the line-item cells).
 */
const meta: Meta<typeof EditableText> = {
  title: "Features/Documents/Workspace/Paper/EditableText",
  component: EditableText,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="sheet sheet--edit !w-[420px] !p-8"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof EditableText>;

function Demo({ initial, multiline, readOnly }: { initial: string; multiline?: boolean; readOnly?: boolean }) {
  const [v, setV] = useState(initial);
  return <EditableText value={v} onChange={setV} placeholder="Add a note for your client" aria-label="Notes" multiline={multiline} readOnly={readOnly} />;
}
export const Empty: Story = { render: () => <Demo initial="" /> };
export const Filled: Story = { render: () => <Demo initial="Thank you for the work together this month." /> };
export const Multiline: Story = { render: () => <Demo multiline initial={"Emirates NBD\nIBAN AE07 0331 2345 6789 0123 456"} /> };
export const ReadOnly: Story = { render: () => <Demo readOnly initial="Net 30. Late fees apply after 14 days." /> };
