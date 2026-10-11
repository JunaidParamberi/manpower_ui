import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { userEvent, within } from "storybook/test";

import { mockAIStreamFetch } from "../../../../.storybook/mocks/ai-stream-fetch";
import { ClientHealthPanel } from "./client-health-panel";
import type { ClientHealthSnapshotRow } from "@/lib/clients/health-queries";

const meta: Meta<typeof ClientHealthPanel> = {
  title: "Features/Clients/Detail/ClientHealthPanel",
  component: ClientHealthPanel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The one card on the client Overview tab: the nightly health band and score, the signals behind it (severity dot, title, detail), an on-demand 'Explain this' read and a 'Draft a nudge' email handed to the composer. Use only on the client Overview. Not for projects (the dashboard has the project digest card) and not as a list badge (use HealthRing).",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ClientHealthPanel>;

const baseSnapshot: ClientHealthSnapshotRow = {
  id: "snap-1",
  clientId: "client-1",
  snapshotDate: "2026-07-30",
  score: 45,
  band: "needs_attention",
  facts: {},
  signals: [
    {
      kind: "overdue_invoices",
      severity: "warning",
      title: "Overdue invoices",
      detail: "1 unpaid invoice, oldest 12 days overdue.",
    },
    {
      kind: "gone_quiet",
      severity: "warning",
      title: "Gone quiet",
      detail: "No documents, project activity, or time entries in 52 days.",
    },
  ],
  createdAt: "2026-07-30T06:30:00.000Z",
};

export const NeedsAttention: Story = {
  args: {
    clientId: "client-1",
    clientName: "Acme Studio",
    clientEmail: "hello@acme.test",
    snapshot: baseSnapshot,
  },
};

export const Excellent: Story = {
  args: {
    clientId: "client-2",
    clientName: "Beacon Labs",
    clientEmail: "team@beacon.test",
    snapshot: {
      ...baseSnapshot,
      id: "snap-2",
      clientId: "client-2",
      score: 100,
      band: "excellent",
      signals: [],
    },
  },
};

export const AtRisk: Story = {
  args: {
    clientId: "client-3",
    clientName: "Drift & Co",
    clientEmail: null,
    snapshot: {
      ...baseSnapshot,
      id: "snap-3",
      clientId: "client-3",
      score: 15,
      band: "at_risk",
      signals: [
        {
          kind: "overdue_invoices",
          severity: "critical",
          title: "Overdue invoices",
          detail: "2 unpaid invoices, oldest 74 days overdue.",
        },
        {
          kind: "revenue_decline",
          severity: "critical",
          title: "Revenue declining",
          detail: "Paid revenue dropped from 4200 to 0 over the last 90 days.",
        },
      ],
    },
  },
};

export const NotScoredYet: Story = {
  args: {
    clientId: "client-4",
    clientName: "New Co",
    clientEmail: "hi@newco.test",
    snapshot: null,
  },
};

/**
 * Press "Explain this" to watch the on-demand narrative stream in from the
 * Relationship Manager agent. `AIThinking` covers the wait — never a plain
 * spinner.
 */
const atRiskSnapshot: ClientHealthSnapshotRow = {
  ...baseSnapshot,
  id: "snap-3",
  clientId: "client-3",
  score: 15,
  band: "at_risk",
  signals: [
    {
      kind: "overdue_invoices",
      severity: "critical",
      title: "Overdue invoices",
      detail: "2 unpaid invoices, oldest 74 days overdue.",
    },
    {
      kind: "revenue_decline",
      severity: "critical",
      title: "Revenue declining",
      detail: "Paid revenue dropped from 4200 to 0 over the last 90 days.",
    },
  ],
};

export const ExplainThisRevealed: Story = {
  args: {
    clientId: "client-3",
    clientName: "Drift & Co",
    clientEmail: null,
    snapshot: atRiskSnapshot,
  },
  decorators: [
    (Story) => {
      useEffect(
        () =>
          mockAIStreamFetch({
            tokens: ["Assessing", " Drift & Co…"],
            delayMs: 150,
            relationshipRead: {
              headline: "Drift & Co is trending toward churn",
              assessment:
                "Two invoices are seriously overdue and paid revenue has fallen to zero over the last quarter — this relationship needs a direct conversation, not another automated nudge.",
              plays: [
                {
                  title: "Call, don't email",
                  rationale:
                    "A 74-day overdue balance has likely already ignored one or more emails.",
                },
                {
                  title: "Offer a payment plan",
                  rationale:
                    "Removing friction on the overdue balance is more likely to restart the relationship than pressure alone.",
                },
              ],
            },
          }),
        [],
      );
      return <Story />;
    },
  ],
  play: async () => {
    const canvas = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: "Explain this" }));
  },
};

/**
 * Press "Draft a check-in" and watch the draft stream in from the
 * Communication Drafter before the "Open in composer" handoff.
 */
export const DraftCheckInRevealed: Story = {
  args: {
    clientId: "client-1",
    clientName: "Acme Studio",
    clientEmail: "hello@acme.test",
    snapshot: baseSnapshot,
  },
  decorators: [
    (Story) => {
      useEffect(
        () =>
          mockAIStreamFetch({
            tokens: ["Drafting", " a check-in…"],
            delayMs: 150,
            emailDraft: {
              mode: "follow_up",
              tone: "friendly",
              subject: "Checking in, Acme Studio",
              body: [
                "Hi Acme team,",
                "",
                "It's been a little while since we last connected, and I wanted to check in — how are things on your end?",
                "There's also an outstanding invoice from a couple of weeks back; happy to answer any questions on it.",
                "",
                "Let me know if there's anything I can help move forward.",
                "",
                "Best,",
                "Jane",
              ].join("\n"),
              targetSummary: "Acme Studio — 1 invoice overdue, quiet for 52 days",
            },
          }),
        [],
      );
      return <Story />;
    },
  ],
  play: async () => {
    const canvas = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: "Draft a check-in" }));
  },
};

/** The drafter is still streaming. `AIThinking` covers the wait. */
export const DraftCheckInStreaming: Story = {
  args: {
    clientId: "client-1",
    clientName: "Acme Studio",
    clientEmail: "hello@acme.test",
    snapshot: baseSnapshot,
  },
  decorators: [
    (Story) => {
      useEffect(
        () =>
          mockAIStreamFetch({
            tokens: ["Drafting a check-in…"],
            delayMs: 5000,
          }),
        [],
      );
      return <Story />;
    },
  ],
  play: async () => {
    const canvas = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: "Draft a check-in" }));
  },
};

/** The drafter failed. The panel explains what happened and offers a retry. */
export const DraftCheckInError: Story = {
  args: {
    clientId: "client-1",
    clientName: "Acme Studio",
    clientEmail: "hello@acme.test",
    snapshot: baseSnapshot,
  },
  decorators: [
    (Story) => {
      useEffect(
        () => mockAIStreamFetch({ error: "The drafter is busy. Try again in a moment." }),
        [],
      );
      return <Story />;
    },
  ],
  play: async () => {
    const canvas = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: "Draft a check-in" }));
  },
};
