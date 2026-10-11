import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AuthThemeToggle } from "./auth-theme-toggle";

const meta: Meta<typeof AuthThemeToggle> = {
  title: "Shared/AuthThemeToggle",
  component: AuthThemeToggle,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AuthThemeToggle>;

export const Default: Story = {};
