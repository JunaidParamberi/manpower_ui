import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ClientFinancialSummary } from "@/lib/clients/client-financial-summary";
import { ClientMoneyStrip } from "./client-money-strip";

const overdue: ClientFinancialSummary = {
  currency: "AED",
  billedTotal: 48200,
  paidTotal: 41800,
  outstandingTotal: 6400,
  overdueTotal: 6400,
  overdueCount: 1,
  oldestOverdueDays: 9,
  invoiceCount: 9,
  otherCurrencyCount: 0,
  avgDaysToPay: 18,
  previousAvgDaysToPay: 11,
};

/**
 * Billed / Outstanding / Pays in / Projects for one client, split by hairlines.
 * Use directly under the client detail header. Not for the dashboard: use KpiCard there.
 * Two columns on narrow widths, four from the shell's 3xl container width.
 */
const meta: Meta<typeof ClientMoneyStrip> = {
  title: "Features/Clients/ClientMoneyStrip",
  component: ClientMoneyStrip,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="@container/shell max-w-[900px] bg-[var(--panel)] py-4"><Story /></div>],
  args: { activeProjects: 2, doneProjects: 1 },
};
export default meta;
type Story = StoryObj<typeof ClientMoneyStrip>;

export const Overdue: Story = { args: { summary: overdue } };
export const AllClear: Story = { args: { summary: { ...overdue, outstandingTotal: 0, overdueTotal: 0, overdueCount: 0, oldestOverdueDays: 0 } } };
export const NewClient: Story = {
  args: {
    activeProjects: 0,
    doneProjects: 0,
    summary: { ...overdue, billedTotal: 0, paidTotal: 0, outstandingTotal: 0, overdueTotal: 0, overdueCount: 0, oldestOverdueDays: 0, invoiceCount: 0, avgDaysToPay: null, previousAvgDaysToPay: null },
  },
};
export const MultiCurrency: Story = { args: { summary: { ...overdue, currency: "GBP", billedTotal: 1240000, outstandingTotal: 312500.5, otherCurrencyCount: 2 } } };
export const Narrow: Story = { args: { summary: overdue }, decorators: [(Story) => <div className="@container/shell max-w-[420px]"><Story /></div>] };
