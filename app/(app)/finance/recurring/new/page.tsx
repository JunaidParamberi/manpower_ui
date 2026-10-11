import { redirect } from "next/navigation";

export default function NewRecurringPage() {
  redirect("/documents/invoices?recurring=1");
}
