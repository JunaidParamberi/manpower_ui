import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkerForm } from "@/components/features/workers/worker-form";
import { FormPageShell } from "@/components/shared/form-page-shell";
import { PageHeader } from "@/components/shared/page-header";
import { listProjectClients } from "@/lib/project-clients/project-client-queries";
import { listSuppliers } from "@/lib/suppliers/supplier-queries";
import { getWorkerById } from "@/lib/workers/worker-queries";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const worker = await getWorkerById(id);
  return { title: worker ? `Edit ${worker.name}` : "Edit worker" };
}

export default async function EditWorkerPage({ params }: PageProps) {
  const { id } = await params;
  const [worker, suppliers, projectClients] = await Promise.all([
    getWorkerById(id),
    listSuppliers(),
    listProjectClients(),
  ]);
  if (!worker) notFound();

  return (
    <FormPageShell maxWidth="7xl">
      <div className="flex flex-col gap-8">
        <PageHeader
          backHref={`/workers/${id}`}
          backLabel={worker.name}
          title="Edit worker"
          description="Update this worker's details."
        />
        <WorkerForm mode="edit" worker={worker} suppliers={suppliers} projectClients={projectClients} />
      </div>
    </FormPageShell>
  );
}
