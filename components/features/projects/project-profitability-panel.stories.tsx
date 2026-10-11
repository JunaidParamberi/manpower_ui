import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ExpenseListRow, TimeEntryListRow } from "@/types";
import type { ProfitabilityInvoice } from "@/lib/projects/project-profitability";

import { ProjectProfitabilityPanel } from "./project-profitability-panel";

const project = { hourly_rate: 150 };

const invoices: ProfitabilityInvoice[] = [
  { total_amount: 8000, payments: [{ amount: 5000 }] },
  { total_amount: 4500, payments: [{ amount: 4500 }] },
];

const expenses = [
  { amount: 1200 },
  { amount: 300 },
] as Pick<ExpenseListRow, "amount">[];

const timeEntries = [
  { duration_seconds: 14400, billed: true },  // 4h billed
  { duration_seconds: 7200, billed: true },   // 2h billed
  { duration_seconds: 3600, billed: false },  // 1h unbilled
] as Pick<TimeEntryListRow, "duration_seconds" | "billed">[];

const meta: Meta<typeof ProjectProfitabilityPanel> = {
  title: "Features/Projects/ProjectProfitabilityPanel",
  component: ProjectProfitabilityPanel,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    currency: { control: "select", options: ["USD", "AED", "GBP", "EUR"] },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectProfitabilityPanel>;

/** Healthy project: collected revenue, positive margin, some unbilled time. */
export const Healthy: Story = {
  args: {
    project,
    invoices,
    expenses,
    timeEntries,
    currency: "USD",
  },
};

/** Negative margin: expenses exceed collected revenue. */
export const NegativeMargin: Story = {
  args: {
    project,
    invoices: [{ total_amount: 2000, payments: [{ amount: 2000 }] }],
    expenses: [{ amount: 3500 }],
    timeEntries,
    currency: "USD",
  },
};

/** No invoices yet — freshly created project with only time logged. */
export const NoInvoicesYet: Story = {
  args: {
    project,
    invoices: [],
    expenses: [],
    timeEntries,
    currency: "USD",
  },
};

/** Fully paid — all invoices collected, no outstanding balance. */
export const FullyPaid: Story = {
  args: {
    project,
    invoices: [
      { total_amount: 5000, payments: [{ amount: 5000 }] },
      { total_amount: 3000, payments: [{ amount: 3000 }] },
    ],
    expenses: [{ amount: 800 }],
    timeEntries: [{ duration_seconds: 28800, billed: true }], // 8h fully billed
    currency: "AED",
  },
};

/** No hourly rate set — unbilled time value shown as hours only. */
export const NoHourlyRate: Story = {
  args: {
    project: { hourly_rate: null },
    invoices,
    expenses,
    timeEntries,
    currency: "USD",
  },
};

/** Empty state — brand new project with nothing tracked yet. */
export const Empty: Story = {
  args: {
    project: { hourly_rate: null },
    invoices: [],
    expenses: [],
    timeEntries: [],
    currency: "USD",
  },
};
