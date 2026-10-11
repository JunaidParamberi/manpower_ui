import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContextBanner } from "./context-banner";

/**
 * Tells you what was filled in when you start a document from a client or project.
 * Use once, right after New, and let it be dismissed. Not for ongoing warnings: use ReadinessLine.
 */
const meta: Meta<typeof ContextBanner> = {
  title: "Features/Documents/Workspace/ContextBanner",
  component: ContextBanner,
  tags: ["autodocs"],
  args: { onDismiss: () => {} },
};
export default meta;
type Story = StoryObj<typeof ContextBanner>;

export const FromClient: Story = { args: { clientName: "Acme Studio", clientColor: "var(--chart-1)", filled: ["client", "project", "AED", "Net 30 due date"] } };
export const OnlyClient: Story = { args: { clientName: "Northwind Labs", clientColor: "var(--chart-4)", filled: ["client", "GBP"] } };
