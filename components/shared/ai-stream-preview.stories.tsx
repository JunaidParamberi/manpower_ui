import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";

import { mockAIStreamFetch } from "../../.storybook/mocks/ai-stream-fetch";
import { AIStreamPreview } from "./ai-stream-preview";

const meta: Meta<typeof AIStreamPreview> = {
  title: "Shared/AIStreamPreview",
  component: AIStreamPreview,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Interactive demo for the Phase 3 SSE streaming pipe (`/api/ai/stream` + `useAIStream`). Use this in Storybook to verify incremental AI output and loading states. Do not embed in production pages — Cmd+K and Document Studio will consume `useAIStream` directly once the Router Agent lands.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AIStreamPreview>;

export const Default: Story = {
  decorators: [
    (Story) => {
      useEffect(() => mockAIStreamFetch(), []);
      return <Story />;
    },
  ],
};

export const Idle: Story = {
  args: {
    displayState: {
      status: "idle",
      text: "",
      route: null,
      error: null,
      donePayload: null,
    },
  },
};

export const Streaming: Story = {
  args: {
    displayState: {
      status: "streaming",
      text: "Routing to Document Writer…",
      route: null,
      error: null,
      donePayload: null,
    },
  },
};

export const Done: Story = {
  args: {
    displayState: {
      status: "done",
      text: "Routing to Document Writer…",
      route: {
        agent: "document-writer",
        confidence: 0.92,
        payload: {
          intent: "create_invoice",
          summary: "Draft an invoice for the website redesign project",
        },
      },
      error: null,
      donePayload: null,
    },
  },
};

export const Error: Story = {
  args: {
    displayState: {
      status: "error",
      text: "",
      route: null,
      error: "Unauthorized — sign in to stream AI responses.",
      donePayload: null,
    },
  },
};

export const LiveMockStream: Story = {
  name: "Live mock stream",
  decorators: [
    (Story) => {
      useEffect(
        () =>
          mockAIStreamFetch({
            tokens: ["Routing to Document Writer…"],
            delayMs: 200,
          }),
        [],
      );
      return <Story />;
    },
  ],
};

export const LiveMockError: Story = {
  name: "Live mock HTTP error",
  decorators: [
    (Story) => {
      useEffect(
        () =>
          mockAIStreamFetch({
            httpStatus: 401,
            error: "Unauthorized",
          }),
        [],
      );
      return <Story />;
    },
  ],
};
