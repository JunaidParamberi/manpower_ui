import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SaveIndicator } from "./save-indicator";

/**
 * Autosave state in the document header. Saving pulses amber, Saved is green, an error offers Retry.
 * Use next to the document title while editing. Not for one-off form submits: use a toast.
 */
const meta: Meta<typeof SaveIndicator> = {
  title: "Features/Documents/Workspace/SaveIndicator",
  component: SaveIndicator,
  tags: ["autodocs"],
  args: { onRetry: () => {}, error: null },
};
export default meta;
type Story = StoryObj<typeof SaveIndicator>;

export const Saving: Story = { args: { status: "saving" } };
export const Saved: Story = { args: { status: "saved" } };
export const Error: Story = { args: { status: "error", error: "Network down" } };
