import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { UpdatePasswordForm } from "./update-password-form";

const meta: Meta<typeof UpdatePasswordForm> = {
  title: "Auth/UpdatePasswordForm",
  component: UpdatePasswordForm,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[420px] max-w-[calc(100vw-2rem)] rounded-[2rem] border bg-background p-8 shadow-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UpdatePasswordForm>;

export const Default: Story = {};

export const Filled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("New password"), "correct-horse-battery");
  },
};

export const PasswordVisible: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("New password"), "correct-horse-battery");
    await userEvent.click(canvas.getByLabelText("Show password"));
  },
};
