import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { DocumentTemplateRow, TiptapDoc } from "@/types";
import { TemplateSheet } from "./template-sheet";

/**
 * Start a document from your saved templates or a starter. Variables such as {{client_name}} show as readable
 * colour chips. Use when someone asks for a template. Not the default way to start: New creates a draft directly.
 */
const meta: Meta<typeof TemplateSheet> = {
  title: "Features/Documents/Workspace/TemplateSheet",
  component: TemplateSheet,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { open: true, onOpenChange: () => {} },
};
export default meta;
type Story = StoryObj<typeof TemplateSheet>;

const doc = (text: string): TiptapDoc => ({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] }) as TiptapDoc;
const t = (over: Partial<DocumentTemplateRow>): DocumentTemplateRow => ({
  id: "t", user_id: null, type: "proposal", name: "Template", description: null, content_json: doc(""), is_system: true, created_at: "", updated_at: "", ...over,
});

const TEMPLATES = [
  t({ id: "m1", is_system: false, user_id: "u", type: "proposal", name: "Website redesign pitch", content_json: doc("Proposal for {{client_name}}. Prepared by {{brand_business_name}} on {{today}}. Overview: Hi {{client_contact_name}}, thank you for considering us for {{project_title}}.") }),
  t({ id: "m2", is_system: false, user_id: "u", type: "other", name: "Kickoff email", content_json: doc("Hi {{client_contact_name}}, here is the plan for week one of {{project_title}}.") }),
  t({ id: "s1", type: "proposal", name: "Simple Proposal", content_json: doc("Project proposal for {{client_name}}. Prepared by {{brand_business_name}} on {{today}}.") }),
  t({ id: "s2", type: "other", name: "Letter", content_json: doc("Dear {{client_contact_name}}, ") }),
];

export const WithTemplates: Story = { args: { templates: TEMPLATES } };
export const StartersOnly: Story = { args: { templates: TEMPLATES.filter((x) => x.is_system) } };
export const Empty: Story = { args: { templates: [] } };
