import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { LoginForm } from "./login-form";

const meta: Meta<typeof LoginForm> = {
  title: "Auth/LoginForm",
  component: LoginForm,
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
type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {};

export const Filled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Email"), "amina@northstar.studio");
    await userEvent.type(canvas.getByLabelText("Password"), "correct-horse-battery");
  },
};

export const PasswordVisible: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Password"), "correct-horse-battery");
    await userEvent.click(canvas.getByLabelText("Show password"));
  },
};

export const MagicLinkTab: Story = {
  name: "Magic link tab",
  parameters: {
    docs: {
      description: {
        story:
          "Clicks the segmented tab control to switch from the default Password mode into Magic link mode, hiding the Password field and swapping the submit button to \"Send magic link\".",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: "Magic link" }));
    await userEvent.type(canvas.getByLabelText("Email"), "amina@northstar.studio");
  },
};
