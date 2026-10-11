import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ActivityFeed } from "./activity-feed";

/**
 * The last handful of things that happened across documents and projects.
 *
 * Use it beside the revenue chart as a "what changed" glance — payments,
 * sends, quote decisions, project status moves. Each money event is priced in
 * its own document's currency; `fallbackCurrency` only covers events that
 * carry none. Don't use it as an audit log: it shows at most five rows and
 * links out rather than paginating.
 */
const meta: Meta<typeof ActivityFeed> = {
  title: "Features/Dashboard/ActivityFeed",
  component: ActivityFeed,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof ActivityFeed>;

export const Default: Story = {
  args: {
    fallbackCurrency: "AED",
    events: [
      {
        type: "invoice_paid",
        id: "1",
        href: "/documents/1",
        label: "Invoice paid",
        who: "Acme Design Co.",
        text: "paid invoice INV-2051",
        amount: 9975,
        currency: "AED",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        type: "doc_sent",
        id: "2",
        href: "/documents/2",
        label: "Document sent",
        who: "You",
        text: "sent invoice INV-2052 to Zenith Studio",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        type: "quote_approved",
        id: "3",
        href: "/documents/3",
        label: "Quote approved",
        who: "Maple Co.",
        text: "approved quote QUO-0012",
        metaSuffix: "Love the timeline.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ],
  },
};

/** Money booked in more than one currency — each row keeps its own. */
export const MixedCurrencies: Story = {
  args: {
    fallbackCurrency: "AED",
    events: [
      {
        type: "invoice_paid",
        id: "1",
        href: "/documents/1",
        label: "Invoice paid",
        who: "Acme Design Co.",
        text: "paid invoice INV-2051",
        amount: 9975,
        currency: "AED",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        type: "invoice_paid",
        id: "2",
        href: "/documents/2",
        label: "Invoice paid",
        who: "Northwind Ltd.",
        text: "paid invoice INV-2049",
        amount: 800,
        currency: "USD",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      },
    ],
  },
};

export const Empty: Story = {
  args: { fallbackCurrency: "AED", events: [] },
};
