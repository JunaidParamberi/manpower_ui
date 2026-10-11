import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { MarketingViewParams } from "@/lib/marketing/marketing-view-params";

import { MarketingFilterBar } from "./marketing-filter-bar";

const PARAMS: MarketingViewParams = {
  view: "month",
  month: "2026-06",
  week: "2026-06-15",
  client: "all",
  platform: "all",
  status: "all",
  campaign: "all",
};

const CLIENTS = [
  { id: "11111111-2222-3333-4444-555555555555", name: "Nomad Studio" },
  { id: "22222222-3333-4444-5555-666666666666", name: "Harbour & Co" },
  { id: "33333333-4444-5555-6666-777777777777", name: "Lantern Coffee" },
];

const meta: Meta<typeof MarketingFilterBar> = {
  title: "Marketing/MarketingFilterBar",
  component: MarketingFilterBar,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The single control row for /marketing: period navigation, the month/week/agenda switch, and the client, platform, and status filters. Every control produces a href and hands it to `onNavigate`, because all of this state lives in the URL — filters survive period navigation and reload, and a filtered view is a shareable link. Platform options are the union of the common platforms, the platforms on the loaded posts, and the active filter value, so an empty month can never empty the filter. The period label lives here rather than inside the calendar; that is what removes the duplicated header row the first version of the page had. `onNavigate` is a prop rather than an internal `useRouter` call so the bar can be storied without a router.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-5xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MarketingFilterBar>;

const BASE_ARGS = {
  params: PARAMS,
  clients: CLIENTS,
  postPlatforms: ["Instagram", "LinkedIn", "Substack"],
  onNavigate: (href: string) => console.log("navigate", href),
};

export const MonthView: Story = {
  args: BASE_ARGS,
};

export const WeekView: Story = {
  args: { ...BASE_ARGS, params: { ...PARAMS, view: "week" } },
};

export const AgendaView: Story = {
  args: { ...BASE_ARGS, params: { ...PARAMS, view: "agenda" } },
};

export const WithActiveFilters: Story = {
  args: {
    ...BASE_ARGS,
    params: {
      ...PARAMS,
      client: CLIENTS[0].id,
      platform: "LinkedIn",
      status: "scheduled",
    },
  },
};

/** An empty period still offers every platform option, including the active one. */
export const EmptyPeriodKeepsPlatformOptions: Story = {
  args: {
    ...BASE_ARGS,
    postPlatforms: [],
    params: { ...PARAMS, platform: "Pinterest" },
  },
};

export const NoClientsYet: Story = {
  args: { ...BASE_ARGS, clients: [] },
};
