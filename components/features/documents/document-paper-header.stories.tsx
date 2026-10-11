import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DocumentPaperHeader } from "./document-paper-header";

const meta: Meta<typeof DocumentPaperHeader> = {
  title: "Features/Documents/DocumentPaperHeader",
  component: DocumentPaperHeader,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ background: "#fff", padding: 24, maxWidth: 720 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DocumentPaperHeader>;

export const Default: Story = {
  args: {
    logoUrl: null,
    businessName: "Manpower Studio",
    primaryColor: "#3550E0",
    docTypeLabel: "Invoice",
    docTitle: "Brand Refresh 2026",
    docNumber: "INV-0042",
  },
};

export const Quote: Story = {
  args: {
    logoUrl: null,
    businessName: "Manpower Studio",
    primaryColor: "#1F8A52",
    docTypeLabel: "Quote",
    docTitle: "E-commerce Platform",
    docNumber: "QUO-0012",
  },
};

export const NoNumber: Story = {
  args: {
    logoUrl: null,
    businessName: "Manpower Studio",
    primaryColor: "#3550E0",
    docTypeLabel: "Proposal",
    docTitle: "Marketing Site Proposal",
    docNumber: null,
  },
};
