import { notFound } from "next/navigation";
import { WorkerDetailView } from "@/components/features/workers/detail/worker-detail-view";
import type { WorkerTab } from "@/lib/workers/worker-tab";
import { getWorkerById } from "@/lib/workers/worker-queries";

export async function WorkerDetail({ id, tab = "overview" }: { id: string; tab?: WorkerTab }) {
  const worker = await getWorkerById(id);
  if (!worker) {
    notFound();
  }
  return <WorkerDetailView worker={worker} tab={tab} />;
}
