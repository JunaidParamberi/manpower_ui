import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Checkbox } from "./checkbox";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldContent,
  FieldTitle,
  FieldSet,
  FieldLegend,
  FieldSeparator,
} from "./field";

const meta: Meta<typeof Field> = {
  title: "Base/Field",
  component: Field,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Field>;

export const Default: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="name">Full name</FieldLabel>
      <Input id="name" placeholder="Junaid Paramberi" />
    </Field>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="email">Email address</FieldLabel>
      <Input id="email" type="email" placeholder="hello@manpower.app" />
      <FieldDescription>
        We&apos;ll send invoice notifications to this address.
      </FieldDescription>
    </Field>
  ),
};

export const WithError: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="amount">Amount</FieldLabel>
      <Input id="amount" type="number" aria-invalid="true" defaultValue="-10" />
      <FieldError errors={[{ message: "Amount must be a positive number." }]} />
    </Field>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Field orientation="horizontal">
      <FieldLabel htmlFor="active">Active project</FieldLabel>
      <FieldContent>
        <Checkbox id="active" />
        <FieldDescription>Toggle to mark this project as active.</FieldDescription>
      </FieldContent>
    </Field>
  ),
};

export const FormGroup: Story = {
  render: () => (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="client-name">Client name</FieldLabel>
        <Input id="client-name" placeholder="Acme Corp" />
      </Field>
      <Field>
        <FieldLabel htmlFor="client-email">Client email</FieldLabel>
        <Input id="client-email" type="email" placeholder="contact@acme.com" />
        <FieldDescription>Used for sending invoices and quotes.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="notes">Notes</FieldLabel>
        <Textarea id="notes" placeholder="Any additional context..." />
      </Field>
    </FieldGroup>
  ),
};

export const WithFieldSet: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend>Business Details</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="company">Company name</FieldLabel>
          <Input id="company" placeholder="Manpower Inc." />
        </Field>
        <FieldSeparator>or</FieldSeparator>
        <Field>
          <FieldLabel htmlFor="sole">Trading as</FieldLabel>
          <Input id="sole" placeholder="John's Design Studio" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
};

export const WithTitleVariant: Story = {
  render: () => (
    <Field>
      <FieldTitle>Project name</FieldTitle>
      <Input placeholder="My awesome project" />
      <FieldDescription>This will appear on all documents.</FieldDescription>
    </Field>
  ),
};
