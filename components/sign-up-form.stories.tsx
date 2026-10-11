import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { SignUpForm } from "./sign-up-form";

const meta: Meta<typeof SignUpForm> = {
  title: "Auth/SignUpForm",
  component: SignUpForm,
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
type Story = StoryObj<typeof SignUpForm>;

export const Default: Story = {};

export const Filled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Email"), "amina@northstar.studio");
    await userEvent.type(canvas.getByLabelText("Password"), "correct-horse-battery");
    await userEvent.type(canvas.getByLabelText("Repeat password"), "correct-horse-battery");
  },
};

export const PasswordMismatch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Email"), "amina@northstar.studio");
    await userEvent.type(canvas.getByLabelText("Password"), "correct-horse-battery");
    await userEvent.type(canvas.getByLabelText("Repeat password"), "wrong-password");
    await userEvent.click(canvas.getByRole("button", { name: /create account/i }));
  },
};
