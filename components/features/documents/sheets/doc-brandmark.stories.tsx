import type { Meta, StoryObj } from "@storybook/react";
import { DocBrandmark } from "./doc-brandmark";

const meta: Meta<typeof DocBrandmark> = {
  title: "Documents/Sheets/DocBrandmark",
  component: DocBrandmark,
  parameters: {
    docs: {
      description: {
        component:
          "Freelancer/agency brand identifier shown in document headers. Renders logo image when available, falls back to first-letter monogram. Use `inverted` on dark backgrounds.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DocBrandmark>;

export const Monogram: Story = {
  args: { logoUrl: null, businessName: "Manpower Studio" },
};

export const SingleLetter: Story = {
  args: { logoUrl: null, businessName: "A" },
};

export const NoName: Story = {
  args: { logoUrl: null, businessName: null },
};

export const Inverted: Story = {
  args: { logoUrl: null, businessName: "Manpower Studio", inverted: true },
  parameters: { backgrounds: { default: "dark" } },
};
