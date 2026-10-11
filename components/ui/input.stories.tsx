import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "Base/Input",
  component: Input,
  tags: ["autodocs"],
  args: { placeholder: "Enter text..." },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const Email: Story = {
  args: { type: "email", placeholder: "hello@manpower.app" },
};

export const Password: Story = {
  args: { type: "password", placeholder: "Enter password" },
};

export const Number: Story = {
  args: { type: "number", placeholder: "0.00" },
};

export const WithValue: Story = {
  args: { defaultValue: "Manpower Inc." },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: "Cannot edit" },
};

export const Invalid: Story = {
  args: { "aria-invalid": "true", defaultValue: "invalid@" },
};

export const File: Story = {
  args: { type: "file" },
};

export const Small: Story = {
  args: { size: "sm", placeholder: "Compact row input (e.g. line items)" },
};
