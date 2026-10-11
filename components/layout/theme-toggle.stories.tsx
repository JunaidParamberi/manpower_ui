import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ThemeToggle } from "./theme-toggle";

const meta: Meta<typeof ThemeToggle> = {
  title: "Layout/ThemeToggle",
  component: ThemeToggle,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "App-shell light/dark pill in the header and More sheet. Applies `data-theme` synchronously inside a View Transition so the new root can fade in over the old (~200ms). Falls back to an instant swap when View Transitions are unavailable or the user prefers reduced motion. Do not use for auth/onboarding — those use AuthThemeToggle.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {};
