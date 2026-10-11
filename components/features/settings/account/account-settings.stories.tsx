import type { Meta, StoryObj } from "@storybook/react";

import { ChangeEmailForm } from "./change-email-form";
import { ChangePasswordForm } from "./change-password-form";
import { DeleteAccountSection } from "./delete-account-section";
import { ExportDataSection } from "./export-data-section";
import { SessionsSection } from "./sessions-section";

const meta: Meta<typeof ChangeEmailForm> = {
  title: "Features/Settings/Account",
  parameters: {
    docs: {
      description: {
        component:
          "Account security settings at /settings/account: email, password, session sign-out, GDPR export, and destructive account deletion.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ChangeEmailForm>;

export const ChangeEmail: Story = {
  render: () => <ChangeEmailForm currentEmail="alex@studio.example" />,
};

export const ChangePassword: Story = {
  render: () => <ChangePasswordForm email="alex@studio.example" />,
};

export const Sessions: Story = {
  render: () => <SessionsSection />,
};

export const ExportData: Story = {
  render: () => <ExportDataSection />,
};

export const DeleteAccount: Story = {
  render: () => <DeleteAccountSection />,
};
