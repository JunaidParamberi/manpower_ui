import type { Metadata } from "next";
import { WorkerForm } from "@/components/features/workers/worker-form";
import { FormPageShell } from "@/components/shared/form-page-shell";
import { PageHeader } from "@/components/shared/page-header";
import { listProjectClients } from "@/lib/project-clients/project-client-queries";
import { listSuppliers } from "@/lib/suppliers/supplier-queries";

export const metadata: Metadata = { title: "New worker" };

export default async function NewWorkerPage() {
  const [suppliers, projectClients] = await Promise.all([listSuppliers(), listProjectClients()]);
  return (
    <FormPageShell maxWidth="7xl">
      <div className="flex flex-col gap-8">
        <PageHeader
          backHref="/workers"
          backLabel="Workers"
          title="New worker"
          description="Add a worker to the registry. Documents can be attached after saving."
        />
        <WorkerForm mode="create" suppliers={suppliers} projectClients={projectClients} />
      </div>
    </FormPageShell>
  );
}
