import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ExpenseListRow } from "@/types";

import { ExpenseSummaryCard } from "./expense-summary-card";

function expense(
  id: string,
  category: ExpenseListRow["category"],
  amount: number,
): ExpenseListRow {
  return {
    id,
    user_id: "u1",
    project_id: null,
    category,
    amount,
    currency: "AED",
    date: "2026-05-01",
    vendor: null,
    notes: null,
    receipt_url: null,
    receipt_urls: [],
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    project: null,
  };
}

const expenses: ExpenseListRow[] = [
  expense("1", "software", 199),
  expense("2", "software", 49),
  expense("3", "travel", 850),
  expense("4", "meals", 120),
  expense("5", "marketing", 400),
];

const meta: Meta<typeof ExpenseSummaryCard> = {
  title: "Features/Expenses/ExpenseSummaryCard",
  component: ExpenseSummaryCard,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ExpenseSummaryCard>;

export const Default: Story = { args: { expenses, defaultCurrency: "AED" } };
export const Empty: Story = { args: { expenses: [], defaultCurrency: "AED" } };
