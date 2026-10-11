import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { TiptapDoc } from "@/types";
import { CLIENTS, CTX, PROJECTS } from "../story-fixtures";
import { RichTextEditor, type RichTextEditorProps } from "./rich-text-editor";

/**
 * A free-form document (a letter, a statement, a note): a title and rich text on the paper.
 * Use for documents without line items. Not for invoices, quotes, proposals or LPOs: they have their own editors.
 */
const meta: Meta<typeof RichTextEditor> = {
  title: "Features/Documents/Workspace/RichTextEditor",
  component: RichTextEditor,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="flex h-[760px] flex-col bg-[var(--panel)]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof RichTextEditor>;

const BODY: TiptapDoc = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Hi Sara, thank you for the call today. Here is a short summary of what we agreed and the next steps." }] }],
} as TiptapDoc;

const base: RichTextEditorProps = {
  mode: "edit",
  fresh: false,
  type: "other",
  documentTitle: "Call summary for Acme",
  documentId: "o1",
  backHref: "/documents",
  backLabel: "Documents",
  status: "draft",
  statusLabel: "Draft",
  statusTone: "neutral",
  canEditContent: true,
  canSwitchToEdit: true,
  editHref: "/documents/o1?edit=1",
  readHref: "/documents/o1",
  today: "2026-10-09",
  actionsEdit: null,
  actionsRead: null,
  variableContext: CTX,
  contentJson: BODY,
  clientId: "c1",
  projectId: null,
  clients: CLIENTS,
  projects: PROJECTS,
  readPaper: <div className="sheet !w-full !min-h-0"><p>The finished document, rendered by the existing sheet.</p></div>,
};

export const Draft: Story = { args: base };
export const Empty: Story = { args: { ...base, documentTitle: "", contentJson: { type: "doc", content: [] } as TiptapDoc, clientId: null } };
