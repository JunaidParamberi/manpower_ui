import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
  title: "Base/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: { placeholder: "Enter your message..." },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue:
      "Thank you for considering Manpower for your next project. I look forward to working with you.",
  },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: "Cannot edit" },
};

export const Invalid: Story = {
  args: { "aria-invalid": "true", defaultValue: "" },
};

export const Rows: Story = {
  args: { rows: 8, placeholder: "Write a detailed proposal or notes here..." },
};
