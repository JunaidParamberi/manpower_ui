import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReadinessLine } from "./readiness-line";

/**
 * One line above the paper that says what a draft still needs before it can be sent, or that it is ready.
 * Use on drafts and sent documents. Not for validation errors on a field: show those on the field.
 */
const meta: Meta<typeof ReadinessLine> = {
  title: "Features/Documents/Workspace/ReadinessLine",
  component: ReadinessLine,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof ReadinessLine>;

export const NotReady: Story = { args: { message: "Before you send, add a due date and a line item with a price.", action: { label: "Set due date", onClick: () => {} } } };
export const Ready: Story = { args: { message: null } };
