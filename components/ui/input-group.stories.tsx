import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search, Mail, DollarSign, Eye, EyeOff } from "lucide-react";
import * as React from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./input-group";

const meta: Meta<typeof InputGroup> = {
  title: "Base/InputGroup",
  component: InputGroup,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof InputGroup>;

export const Default: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <Search size={16} />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search clients..." />
    </InputGroup>
  ),
};

export const WithPrefix: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <InputGroupText>$</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput type="number" placeholder="0.00" />
    </InputGroup>
  ),
};

export const WithSuffix: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput type="email" placeholder="hello@manpower.app" />
      <InputGroupAddon align="inline-end">
        <Mail size={16} />
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const WithButton: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput placeholder="Search..." />
      <InputGroupAddon align="inline-end">
        <InputGroupButton>Search</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};

function PasswordToggleDemo() {
  const [show, setShow] = React.useState(false);

  return (
    <InputGroup>
      <InputGroupInput type={show ? "text" : "password"} placeholder="Enter password" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton onClick={() => setShow(!show)}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export const PasswordToggle: Story = {
  render: () => <PasswordToggleDemo />,
};

export const WithBlockLabel: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon align="block-start">
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="yoursite.com" />
    </InputGroup>
  ),
};

export const WithTextarea: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon align="block-start">
        <InputGroupText>Notes</InputGroupText>
      </InputGroupAddon>
      <InputGroupTextarea placeholder="Add any extra context here..." />
    </InputGroup>
  ),
};

export const AmountWithCurrency: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <DollarSign size={16} />
      </InputGroupAddon>
      <InputGroupInput type="number" placeholder="0.00" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>USD</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
};
