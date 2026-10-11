import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BriefCard } from "./brief-card";

/**
 * The "Today's brief" rail card: one narrated line on plans the nightly
 * agents scan, deterministic fact lines everywhere else.
 *
 * Use it to give the freelancer a morning lens on what matters — the same
 * shape whether the text came from the Project Intelligence digest or was
 * derived from live queue money. Don't use it for actionable triage; the
 * "Needs you" queue owns that.
 */
const meta: Meta<typeof BriefCard> = {
  title: "Features/Dashboard/BriefCard",
  component: BriefCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof BriefCard>;

export const Narrated: Story = {
  args: {
    brief: {
      narrative:
        "Brand refresh is burning 40% faster than planned — the Zenith logo work is the only bright spot this week. Acme Design Co. hasn't responded to the revised quote.",
      digestDate: "2026-09-13",
      lines: [
        { id: "p1-0", title: "Brand refresh over budget", detail: "Spend is 40% ahead of plan, deadline in 9 days.", href: "/projects/p1", band: "high" },
        { id: "p2-1", title: "Quote awaiting reply", detail: "Maple Co. hasn't opened the revised quote.", href: "/documents/q12", band: "medium" },
      ],
      showUpgradeHint: false,
    },
  },
};

export const DeterministicFallback: Story = {
  args: {
    brief: {
      narrative: null,
      digestDate: null,
      lines: [
        { id: "overdue_invoice-inv1", title: "Invoice #INV-2051", detail: "Acme Design Co. · 12 days overdue", href: "/documents/inv1", band: "high" },
        { id: "overdue_invoice-inv2", title: "Invoice #INV-2049", detail: "Maple Co. · 5 days overdue", href: "/documents/inv2", band: "medium" },
        { id: "draft_unsent-d1", title: "Website redesign", detail: "draft, unsent for 11 days", href: "/documents/d1", band: "low" },
      ],
      showUpgradeHint: true,
    },
  },
};

export const NothingToReport: Story = {
  args: {
    brief: { narrative: null, digestDate: null, lines: [], showUpgradeHint: false },
  },
};