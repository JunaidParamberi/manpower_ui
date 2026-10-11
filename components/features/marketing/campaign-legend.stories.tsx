import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { CampaignRow } from "@/lib/marketing/campaign-queries";
import type { MarketingViewParams } from "@/lib/marketing/marketing-view-params";

import { CampaignLegend } from "./campaign-legend";

const PARAMS: MarketingViewParams = {
  view: "month",
  month: "2026-06",
  week: "2026-06-15",
  client: "all",
  platform: "all",
  status: "all",
  campaign: "all",
};

const CAMPAIGNS: CampaignRow[] = [
  {
    id: "11111111-2222-3333-4444-555555555555",
    name: "Q3 product launch",
    clientId: "aaaaaaaa-2222-3333-4444-555555555555",
    clientName: "Nomad Studio",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    postCount: 12,
  },
  {
    id: "66666666-7777-8888-9999-aaaaaaaaaaaa",
    name: "Retainer — always-on",
    clientId: null,
    clientName: null,
    startDate: "2026-06-01",
    endDate: "2026-12-31",
    postCount: 8,
  },
  {
    id: "77777777-8888-9999-aaaa-bbbbbbbbbbbb",
    name: "Summer coffee series with a very long name",
    clientId: null,
    clientName: "Lantern Coffee",
    startDate: "2026-06-10",
    endDate: "2026-08-31",
    postCount: 3,
  },
];

const meta: Meta<typeof CampaignLegend> = {
  title: "Marketing/CampaignLegend",
  component: CampaignLegend,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "One chip per content campaign — colour dot, name, post count, delete. The colour matches the stripe `PostChip` draws, both derived from the campaign id, so campaign membership is readable on the calendar without a colour column in the database. Clicking a chip toggles the `campaign` URL filter. Use it directly above a calendar or list of posts. It renders nothing when there are no campaigns, so callers don't need their own guard. Delete is delegated to the parent via `onDelete` — this component never calls a server action, which keeps it storyable.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-4xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CampaignLegend>;

const BASE_ARGS = {
  campaigns: CAMPAIGNS,
  params: PARAMS,
  onNavigate: (href: string) => console.log("navigate", href),
  onDelete: (campaign: CampaignRow) => console.log("delete", campaign.id),
};

export const Default: Story = {
  args: BASE_ARGS,
};

export const OneCampaignSelected: Story = {
  args: {
    ...BASE_ARGS,
    params: { ...PARAMS, campaign: CAMPAIGNS[0].id },
  },
};

export const SingleCampaign: Story = {
  args: { ...BASE_ARGS, campaigns: [CAMPAIGNS[0]] },
};

/** With no campaigns the component renders nothing at all. */
export const NoCampaigns: Story = {
  args: { ...BASE_ARGS, campaigns: [] },
};
