import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PaperField } from "./paper-field";

/**
 * A clickable area on the paper, like the client block or a date, that opens a picker.
 * Use as the trigger of RailPicker or RailDatePicker. Not for text you type in place: use EditableText.
 */
const meta: Meta<typeof PaperField> = {
  title: "Features/Documents/Workspace/Paper/PaperField",
  component: PaperField,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="sheet sheet--edit !w-[360px] !p-8"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PaperField>;

export const ClientBlock: Story = {
  args: {
    "aria-label": "Billed to",
    children: (
      <>
        <div className="party__name">Acme Studio</div>
        <div className="party__line">Sara Haddad<br />Business Bay, Dubai</div>
      </>
    ),
  },
};
export const MissingDate: Story = { args: { warn: true, "aria-label": "Due date", children: "Add due date" } };
export const ReadOnly: Story = { args: { readOnly: true, children: "9 Nov 2026" } };
