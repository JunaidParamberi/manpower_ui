import type { Metadata } from "next";
import { AddWorkerButton } from "@/components/features/workers/add-worker-button";
import { WorkersTable } from "@/components/features/workers/workers-table";
import { PageHeader } from "@/components/shared/page-header";
import { listWorkers } from "@/lib/workers/worker-queries";

export const metadata: Metadata = { title: "Workers" };

export default async function WorkersPage() {
  const workers = await listWorkers();
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Workers"
        description="Worker / employee registry."
        actions={<AddWorkerButton />}
      />
      <WorkersTable workers={workers} />
    </div>
  );
}
