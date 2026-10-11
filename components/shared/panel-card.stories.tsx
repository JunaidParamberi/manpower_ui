import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Skeleton } from "@/components/shared/skeletons";
import {
  PanelCard,
  PanelCardBody,
  PanelCardFooter,
  PanelCardHeader,
  PanelCardList,
  PanelCardRow,
} from "./panel-card";

/**
 * PanelCard is the refined app card: a 46px header bar with a 13px title, 16px
 * sides, and flush rows split by hairlines. Use it for dashboard and detail
 * surfaces. Don't use it for dialogs or forms (they have their own shells), and
 * don't nest bordered boxes inside it — use PanelCardList rows instead.
 */
const meta: Meta<typeof PanelCard> = {
  title: "Shared/PanelCard",
  component: PanelCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="max-w-[380px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PanelCard>;

const Dot = ({ tone }: { tone: string }) => <span className={`size-1.5 shrink-0 rounded-full ${tone}`} />;

export const Default: Story = {
  render: () => (
    <PanelCard>
      <PanelCardHeader title="Today's brief" />
      <PanelCardBody>
        <p className="text-body text-[var(--fg-2)]">
          Cash is healthy but Northwind is drifting. Chase INV-0008 today, then invoice Lumen while the yes is fresh.
        </p>
      </PanelCardBody>
    </PanelCard>
  ),
};

export const WithMetaAndList: Story = {
  render: () => (
    <PanelCard>
      <PanelCardHeader title="Active work" meta="3" />
      <PanelCardList>
        <PanelCardRow href="#">
          <Dot tone="bg-[var(--warning)]" />
          <span className="min-w-0 flex-1 truncate font-medium">Brand refresh · Northwind Studio</span>
          <span className="text-meta text-[var(--fg-3)]">5d</span>
        </PanelCardRow>
        <PanelCardRow href="#">
          <Dot tone="bg-[var(--fg-3)]" />
          <span className="min-w-0 flex-1 truncate font-medium">Website build · Lumen Labs</span>
          <span className="text-meta text-[var(--fg-3)]">3w</span>
        </PanelCardRow>
      </PanelCardList>
    </PanelCard>
  ),
};

export const LongNames: Story = {
  render: () => (
    <PanelCard>
      <PanelCardHeader title="Clients" />
      <PanelCardList>
        <PanelCardRow href="#">
          <Dot tone="bg-[var(--danger)]" />
          <span className="min-w-0 flex-1 truncate font-medium">
            Al Noor Hospitality & Events Management Group LLC — Dubai Marina Branch
          </span>
          <span className="shrink-0 text-meta tabular-nums text-[var(--fg-3)]">41/100</span>
        </PanelCardRow>
      </PanelCardList>
    </PanelCard>
  ),
};

export const WithDescriptionAndFooter: Story = {
  render: () => (
    <PanelCard>
      <PanelCardHeader title="Revenue" description="Last 6 months · paid in AED" meta={<span>6M</span>} />
      <PanelCardBody>
        <div className="h-32 rounded-md bg-[var(--bg-subtle)]" />
      </PanelCardBody>
      <PanelCardFooter>
        <div className="flex flex-col gap-0.5">
          <span className="text-[var(--fg-3)]">Total</span>
          <span className="text-[15px] font-semibold tabular-nums">AED 81,450</span>
        </div>
      </PanelCardFooter>
    </PanelCard>
  ),
};

export const Empty: Story = {
  render: () => (
    <PanelCard>
      <PanelCardHeader title="Active work" meta="0" />
      <PanelCardBody>
        <p className="text-body text-muted-foreground">No active projects.</p>
      </PanelCardBody>
    </PanelCard>
  ),
};

export const Loading: Story = {
  render: () => (
    <PanelCard aria-busy="true">
      <PanelCardHeader title="Active work" />
      <PanelCardBody>
        <Skeleton w="100%" h={14} r={4} />
        <Skeleton w="70%" h={14} r={4} />
      </PanelCardBody>
    </PanelCard>
  ),
};
