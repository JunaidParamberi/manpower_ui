import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ClientsCard } from "./clients-card";

/**
 * The "Clients" rail card: worst-health clients first, with the dominant
 * signal kind beside each score.
 *
 * Use it to spot relationships that need a human touch before they turn into
 * churn. Don't use it to manage a client's full health — the client page owns
 * that.
 */
const meta: Meta<typeof ClientsCard> = {
  title: "Features/Dashboard/ClientsCard",
  component: ClientsCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof ClientsCard>;

export const AtRisk: Story = {
  args: {
    clients: {
      source: "nightly",
      cappedForLiveComputation: false,
      clients: [
        {
          clientId: "c1",
          clientName: "Acme Design Co.",
          score: 34,
          band: "at_risk",
          topSignal: { kind: "overdue_invoices", severity: "critical", title: "Two invoices overdue", detail: "INV-2051 is 12 days late." },
        },
        {
          clientId: "c2",
          clientName: "Maple Co.",
          score: 52,
          band: "needs_attention",
          topSignal: { kind: "gone_quiet", severity: "warning", title: "No reply in 3 weeks", detail: "Last touch was a sent quote." },
        },
        {
          clientId: "c3",
          clientName: "Zenith Studio",
          score: 78,
          band: "healthy",
          topSignal: { kind: "stalled_pipeline", severity: "info", title: "No new work in 30 days", detail: "Last project completed." },
        },
      ],
    },
  },
};

export const LongClientName: Story = {
  args: {
    ...AtRisk.args,
    clients: {
      ...AtRisk.args!.clients!,
      clients: [
        {
          ...AtRisk.args!.clients!.clients[0],
          clientName: "Al Noor Hospitality & Events Management Group LLC — Dubai Marina Branch",
        },
      ],
    },
  },
};

export const AllHealthy: Story = {
  args: {
    clients: { source: "live", cappedForLiveComputation: false, clients: [] },
  },
};

export const CappedForLiveComputation: Story = {
  args: {
    clients: { source: "live", cappedForLiveComputation: true, clients: [] },
  },
};