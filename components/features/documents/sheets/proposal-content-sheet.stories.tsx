import type { Meta, StoryObj } from "@storybook/react";
import { ProposalContentSheet } from "./proposal-content-sheet";
import type { VariableContext } from "@/lib/documents/variables";

const BASE_CONTEXT: VariableContext = {
  now: new Date("2026-05-28"),
  brand: {
    business_name: "Manpower Studio",
    primary_color: "#4F6EF7",
    email_signature: null,
    logo_url: null,
  },
  sender: {
    name: "Junaid Paramberi",
    company_name: "Manpower Studio FZ-LLC",
    email: "junaid@manpower.studio",
    address_line1: "DIFC, Dubai",
    address_line2: null,
    city: "Dubai",
    region: null,
    postal_code: null,
    country: "UAE",
    vat_number: "100234567890003",
    gstin: null,
    vat_reg_no: null,
  },
  client: {
    name: "Sara Al Hashimi",
    contact_name: "Sara Al Hashimi",
    email: "sara@nexus.ae",
    company: "Nexus Digital",
    phone: null,
    address: null,
  },
  project: { title: "E-Commerce Platform Redesign" },
};

const SAMPLE_TIPTAP_DOC = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "About this project" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Nexus Digital has grown rapidly over the past 18 months. The current e-commerce platform reflects an earlier stage of the business — this proposal outlines a focused redesign to support the next phase of growth.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "What we'll deliver" }],
    },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "UX research & journey mapping (2 weeks)" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Wireframes for 10 core screens" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "High-fidelity UI design in Figma" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Design system documentation" }] }] },
      ],
    },
  ],
};

const meta: Meta<typeof ProposalContentSheet> = {
  title: "Documents/Sheets/ProposalContentSheet",
  component: ProposalContentSheet,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Paginated content pages for a proposal document. Renders Tiptap rich-text JSON via TiptapContentRenderer inside DocumentPageBody — auto-paginated based on content height. Follows ProposalCoverSheet in the document sheet router.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProposalContentSheet>;

export const WithContent: Story = {
  args: {
    variableContext: BASE_CONTEXT,
    proposalNumber: "PROP-0007",
    clientName: "Nexus Digital",
    projectName: "E-Commerce Platform Redesign",
    contentJson: SAMPLE_TIPTAP_DOC,
  },
};

export const EmptyContent: Story = {
  name: "No content yet",
  args: {
    variableContext: BASE_CONTEXT,
    proposalNumber: "PROP-0007",
    clientName: "Nexus Digital",
    projectName: "E-Commerce Platform Redesign",
    contentJson: null,
  },
};
