import { notFound, redirect } from "next/navigation";

import { getRecurringInvoice } from "@/lib/recurring/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecurringDetailPage({ params }: PageProps) {
  const { id } = await params;
  const schedule = await getRecurringInvoice(id);

  if (!schedule) {
    notFound();
  }

  if (schedule.source_document_id) {
    redirect(`/documents/${schedule.source_document_id}/edit`);
  }

  redirect("/documents/invoices?recurring=1");
}
