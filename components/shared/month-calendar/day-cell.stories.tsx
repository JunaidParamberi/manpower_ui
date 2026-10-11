import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DayCell } from "./day-cell";

function SampleChip({ label }: { label: string }) {
  return (
    <div className="truncate rounded-sm bg-[var(--accent-soft)] px-1.5 py-1 text-[11px] leading-tight text-foreground">
      {label}
    </div>
  );
}

const THREE = [
  <SampleChip key="a" label="IG · Launch teaser" />,
  <SampleChip key="b" label="LI · Case study" />,
  <SampleChip key="c" label="X · Thread" />,
];

const SIX = [
  ...THREE,
  <SampleChip key="d" label="TikTok · Behind the scenes" />,
  <SampleChip key="e" label="YouTube · Short" />,
  <SampleChip key="f" label="Threads · Poll" />,
];

const meta: Meta<typeof DayCell> = {
  title: "Shared/MonthCalendar/DayCell",
  component: DayCell,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "One day inside a calendar grid. Renders a date badge, a hover-revealed add button, a capped list of caller-supplied event nodes, and a '+N more' popover for the remainder. Shared by MonthCalendar (variant=\"compact\", 3 events) and WeekCalendar (variant=\"tall\", 10 events) so the two views cannot drift apart. This is the pure variant with no drag-and-drop hooks — use it in stories and in SSR paths, and use DroppableDayCell inside a DndContext when the cell must accept drops. Not a date picker: for single-date selection in a form use shadcn's Calendar via FormDatePicker.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-44 overflow-hidden rounded-md border border-border">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DayCell>;

export const Empty: Story = {
  args: { iso: "2026-06-15", dateNumber: "15", events: [] },
};

export const WithEvents: Story = {
  args: { iso: "2026-06-15", dateNumber: "15", events: THREE },
};

export const Overflowing: Story = {
  args: { iso: "2026-06-15", dateNumber: "15", events: SIX, maxEvents: 3 },
};

export const Today: Story = {
  args: {
    iso: "2026-06-15",
    dateNumber: "15",
    events: THREE,
    isToday: true,
  },
};

export const SpillDay: Story = {
  args: { iso: "2026-07-01", dateNumber: "1", events: [], inMonth: false },
};

export const DropTargetActive: Story = {
  args: {
    iso: "2026-06-15",
    dateNumber: "15",
    events: THREE,
    isOver: true,
  },
};

export const Tall: Story = {
  args: {
    iso: "2026-06-15",
    dateNumber: "15",
    events: SIX,
    maxEvents: 10,
    variant: "tall",
  },
};

/** WeekCalendar uses `label` for the weekday name on stacked narrow layouts. */
export const WithLabel: Story = {
  args: {
    iso: "2026-06-15",
    dateNumber: "15",
    events: THREE,
    label: "Mon",
    variant: "tall",
    maxEvents: 10,
  },
};
