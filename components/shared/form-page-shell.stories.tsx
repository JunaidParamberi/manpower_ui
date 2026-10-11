import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FormPageShell } from "./form-page-shell";

const meta: Meta<typeof FormPageShell> = {
  title: "Shared/FormPageShell",
  component: FormPageShell,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof FormPageShell>;

function DemoContent({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-3 h-32 rounded bg-[var(--bg-subtle)]" />
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <FormPageShell>
      <DemoContent label="Default — max-w-2xl (~672px)" />
    </FormPageShell>
  ),
};

export const Medium: Story = {
  render: () => (
    <FormPageShell maxWidth="md">
      <DemoContent label="max-w-md" />
    </FormPageShell>
  ),
};

export const Wide: Story = {
  render: () => (
    <FormPageShell maxWidth="4xl">
      <DemoContent label="max-w-4xl" />
    </FormPageShell>
  ),
};

export const Full: Story = {
  render: () => (
    <FormPageShell maxWidth="full">
      <DemoContent label="max-w-none (full bleed)" />
    </FormPageShell>
  ),
};
