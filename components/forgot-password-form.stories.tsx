import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import {
  resetSupabaseClientMocks,
  setResetPasswordForEmailMock,
} from "../.storybook/mocks/supabase-client";
import { ForgotPasswordForm } from "./forgot-password-form";

const meta: Meta<typeof ForgotPasswordForm> = {
  title: "Auth/ForgotPasswordForm",
  component: ForgotPasswordForm,
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
type Story = StoryObj<typeof ForgotPasswordForm>;

export const Default: Story = {};

export const Filled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Email"), "amina@northstar.studio");
  },
};

export const Success: Story = {
  play: async ({ canvasElement }) => {
    resetSupabaseClientMocks();
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Email"), "amina@northstar.studio");
    await userEvent.click(canvas.getByRole("button", { name: /send reset link/i }));
  },
};

export const RateLimited: Story = {
  play: async ({ canvasElement }) => {
    setResetPasswordForEmailMock(() =>
      Promise.resolve({
        error: Object.assign(new Error("email rate limit exceeded"), {
          code: "over_email_send_rate_limit",
          status: 429,
        }),
      })
    );

    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Email"), "amina@northstar.studio");
    await userEvent.click(canvas.getByRole("button", { name: /send reset link/i }));

    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Too many reset emails requested. Please wait a minute, then try again."
    );
    resetSupabaseClientMocks();
  },
};
