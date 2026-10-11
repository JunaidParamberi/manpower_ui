import type { Metadata } from "next";

import { ClientForm } from "@/components/features/clients/client-form";
import { FormPageShell } from "@/components/shared/form-page-shell";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "New client",
};

export default function NewClientPage() {
  return (
    <FormPageShell maxWidth="7xl">
      <div className="flex flex-col gap-8">
        <PageHeader
          backHref="/clients"
          backLabel="Clients"
          title="New client"
          description="Add someone you bill or work with. You can edit everything later."
        />
        <ClientForm mode="create" />
      </div>
    </FormPageShell>
  );
}
