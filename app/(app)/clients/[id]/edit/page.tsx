import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClientForm } from "@/components/features/clients/client-form";
import { FormPageShell } from "@/components/shared/form-page-shell";
import { getClientById } from "@/lib/clients/actions";
import { clientRowToFormValues } from "@/lib/clients/form-values";
import { pageTitle } from "@/lib/metadata";
import { PageHeader } from "@/components/shared/page-header";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const client = await getClientById(id);
  return {
    title: client ? pageTitle("Edit", client.name) : "Edit",
  };
}

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) {
    notFound();
  }

  const formDefaults = clientRowToFormValues(client);

  return (
    <FormPageShell maxWidth="7xl">
      <div className="flex flex-col gap-8">
        <PageHeader
          backHref={`/clients/${client.id}`}
          backLabel="Back to client"
          title="Edit client"
          description="Update billing and contact details. Changes appear on the client profile immediately."
        />
        <ClientForm
          mode="edit"
          clientId={client.id}
          defaultValues={formDefaults}
        />
      </div>
    </FormPageShell>
  );
}
