import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NewDocumentButton } from "./new-document-button";

/**
 * Creates a draft and opens it straight in the editor. The arrow lists the other types, templates and Kraft.
 * Pass the client or project you are on so the new document starts filled in.
 * Use wherever a document can start. Not for converting an existing document: use the convert actions.
 */
const meta: Meta<typeof NewDocumentButton> = {
  title: "Features/Documents/Workspace/NewDocumentButton",
  component: NewDocumentButton,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof NewDocumentButton>;

export const Invoice: Story = { args: { contextType: "invoice" } };
export const FromClient: Story = { args: { contextType: "invoice", clientId: "3f2b8c1e-1a2b-4c3d-8e9f-0a1b2c3d4e5f", label: "New invoice" } };
export const Quote: Story = { args: { contextType: "quote", variant: "outline" } };
