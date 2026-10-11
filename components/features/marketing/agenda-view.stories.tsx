import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AgendaView } from "./agenda-view";
import type { PostChipPost } from "./post-chip";

const CAMPAIGN = "11111111-2222-3333-4444-555555555555";

function at(day: number, hour: number, minute = 0): string {
  return new Date(2026, 5, day, hour, minute).toISOString();
}

const POSTS: PostChipPost[] = [
  {
    id: "1",
    title: "Launch teaser — 3 slides",
    platform: "Instagram",
    status: "scheduled",
    scheduledAt: at(15, 9),
    campaignId: CAMPAIGN,
  },
  {
    id: "2",
    title: "Studio tour",
    platform: "TikTok",
    status: "drafted",
    scheduledAt: at(15, 14),
    campaignId: CAMPAIGN,
  },
  {
    id: "3",
    title: "Case study — Nomad Studio rebrand",
    platform: "LinkedIn",
    status: "scheduled",
    scheduledAt: at(17, 11),
    campaignId: null,
  },
  {
    id: "4",
    title: "Build-in-public thread",
    platform: "X",
    status: "posted",
    scheduledAt: at(19, 8),
    campaignId: null,
  },
  {
    id: "5",
    title: "Repurpose the pricing thread",
    platform: "X",
    status: "idea",
    scheduledAt: null,
    campaignId: null,
  },
];

const meta: Meta<typeof AgendaView> = {
  title: "Marketing/AgendaView",
  component: AgendaView,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The period's posts as a chronological list grouped by day, with unscheduled posts in a trailing group. Use it when the question is \"what's coming up, in order\" rather than \"how is the month shaped\" — it reads well on narrow screens where a month grid does not. It replaces the original status-section list, which printed an empty section for every status a sparse month happened not to use. Only non-empty groups render, and the component draws no empty state of its own: when there are no posts at all the caller shows one.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AgendaView>;

export const Default: Story = {
  args: { posts: POSTS, onPostClick: (post) => console.log("open", post.id) },
};

export const OnlyUnscheduled: Story = {
  args: {
    posts: [POSTS[4]],
    onPostClick: (post) => console.log("open", post.id),
  },
};

export const SingleDay: Story = {
  args: {
    posts: [POSTS[0], POSTS[1]],
    onPostClick: (post) => console.log("open", post.id),
  },
};

/** No posts: renders nothing, because the caller owns the empty state. */
export const Empty: Story = {
  args: { posts: [], onPostClick: () => {} },
};
