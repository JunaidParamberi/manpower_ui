import { redirect } from "next/navigation";

export default function RecurringInvoicesPage() {
  redirect("/documents/invoices?recurring=1");
}
