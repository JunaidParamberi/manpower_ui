import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const meta: Meta<typeof Table> = {
  title: "Base/Table",
  component: Table,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Table>;

const invoices = [
  { id: "INV-0001", client: "Acme Corp", amount: "$2,500.00", status: "paid", due: "Jan 15, 2026" },
  { id: "INV-0002", client: "Bright Media", amount: "$1,200.00", status: "sent", due: "Jan 22, 2026" },
  { id: "INV-0003", client: "Orion Tech", amount: "$4,800.00", status: "overdue", due: "Jan 10, 2026" },
  { id: "INV-0004", client: "Nimbus Ltd", amount: "$750.00", status: "draft", due: "Feb 1, 2026" },
];

const statusVariant = {
  paid: "success" as const,
  sent: "info" as const,
  overdue: "danger" as const,
  draft: "secondary" as const,
};

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-end">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell className="font-medium">{inv.id}</TableCell>
            <TableCell>{inv.client}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[inv.status as keyof typeof statusVariant]}>
                {inv.status}
              </Badge>
            </TableCell>
            <TableCell className="text-end">{inv.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-end">$9,250.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const Simple: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          { name: "Alice Johnson", email: "alice@example.com", role: "Admin" },
          { name: "Bob Smith", email: "bob@example.com", role: "Member" },
          { name: "Carol White", email: "carol@example.com", role: "Member" },
        ].map((user) => (
          <TableRow key={user.email}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
