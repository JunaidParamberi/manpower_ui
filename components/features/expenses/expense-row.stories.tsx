import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ExpenseListRow } from "@/types";

import { Table, TableBody } from "@/components/ui/table";

import { ExpenseRow } from "./expense-row";

const baseExpense: ExpenseListRow = {
  id: "e1",
  user_id: "u1",
  project_id: "p1",
  category: "software",
  amount: 49.99,
  currency: "USD",
  date: "2026-05-01",
  vendor: "Figma",
  notes: "Monthly subscription",
  receipt_url: null,
  receipt_urls: [],
  created_at: "2026-05-01T10:00:00Z",
  updated_at: "2026-05-01T10:00:00Z",
  project: { id: "p1", title: "Brand Refresh 2026" },
};

const meta: Meta<typeof ExpenseRow> = {
  title: "Features/Expenses/ExpenseRow",
  component: ExpenseRow,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <Table>
        <TableBody>
          <Story />
        </TableBody>
      </Table>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ExpenseRow>;

export const Default: Story = { args: { expense: baseExpense, onEdit: () => {} } };

export const WithAttachment: Story = {
  args: {
    expense: { ...baseExpense, receipt_urls: ["https://example.com/r1.pdf"] },
    onEdit: () => {},
  },
};

export const MultipleAttachments: Story = {
  args: {
    expense: {
      ...baseExpense,
      receipt_urls: [
        "https://example.com/r1.pdf",
        "https://example.com/r2.pdf",
        "https://example.com/r3.pdf",
      ],
    },
    onEdit: () => {},
  },
};

export const NoProject: Story = {
  args: {
    expense: { ...baseExpense, project: null, project_id: null },
    onEdit: () => {},
  },
};
