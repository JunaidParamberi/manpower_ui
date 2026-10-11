import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NewDocumentLanding } from "./new-document-landing";

/**
 * The page behind old "new document" links. With a type it creates the draft and moves on (shown here as the
 * brief "Creating" state); without one it asks what to make. Not used inside the app any more: New creates directly.
 */
const meta: Meta<typeof NewDocumentLanding> = {
  title: "Features/Documents/Workspace/NewDocumentLanding",
  component: NewDocumentLanding,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { clientId: null, projectId: null, templates: [], openTemplates: false },
};
export default meta;
type Story = StoryObj<typeof NewDocumentLanding>;

export const Chooser: Story = { args: { type: null } };
export const CreatingInvoice: Story = { args: { type: "invoice" } };
