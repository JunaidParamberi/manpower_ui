import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  Spinner,
  DotPulse,
  ProgressIndeterminate,
  AIThinking,
  InlineLoader,
  ButtonLoading,
} from "./loaders";

const meta: Meta = {
  title: "Shared/Loaders",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Spinner />
      <DotPulse />
      <InlineLoader />
      <AIThinking />
    </div>
  ),
};

export const SpinnerSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </div>
  ),
};

export const SpinnerOnAccent: Story = {
  render: () => (
    <div
      style={{
        background: "var(--accent)",
        padding: 24,
        borderRadius: 8,
        display: "inline-flex",
        gap: 12,
      }}
    >
      <Spinner tone="on-accent" />
      <Spinner tone="on-accent" size="lg" />
    </div>
  ),
};

export const DotPulseAccent: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <DotPulse />
      <DotPulse accent />
    </div>
  ),
};

export const ProgressBar: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <ProgressIndeterminate />
    </div>
  ),
};

export const Thinking: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <AIThinking />
      <AIThinking label="Drafting invoice…" />
      <AIThinking label="Analyzing" size={20} />
    </div>
  ),
};

export const Inline: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <InlineLoader />
      <InlineLoader label="Generating PDF…" />
    </div>
  ),
};

export const ButtonLoadingDemo: Story = {
  render: () => (
    <div className="flex gap-3">
      <ButtonLoading
        className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm text-background"
        loading
      >
        Saving…
      </ButtonLoading>
      <ButtonLoading className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm text-background">
        Save
      </ButtonLoading>
    </div>
  ),
};
