import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { BrandKitRow } from "@/types";

import { BrandKitForm } from "./brand-kit-form";

const brandKit: BrandKitRow = {
  id: "storybook-brand-kit",
  user_id: "storybook-user",
  logo_url: null,
  primary_color: "#3550E0",
  secondary_color: "#F5F7FF",
  font: "Inter",
  email_signature: "Best regards,\nAmina Rahman\nNorthstar Creative",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-05-25T00:00:00.000Z",
};

const meta: Meta<typeof BrandKitForm> = {
  title: "Onboarding/BrandKitForm",
  component: BrandKitForm,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[720px] max-w-[calc(100vw-2rem)] rounded-[2rem] border bg-background p-8 shadow-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BrandKitForm>;

export const OnboardingEmpty: Story = {
  args: {
    initialBrandKit: null,
    variant: "onboarding",
  },
};

export const OnboardingExistingBrand: Story = {
  args: {
    initialBrandKit: brandKit,
    variant: "onboarding",
  },
};

export const SettingsVariant: Story = {
  args: {
    initialBrandKit: brandKit,
    redirectAfterSave: false,
    backHref: "/settings",
    backLabel: "Back to settings",
    submitLabel: "Save brand kit",
    variant: "default",
  },
};
