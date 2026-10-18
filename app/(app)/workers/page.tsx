import Link from "next/link";
import { Plus } from "lucide-react";

import { listWorkers } from "@/lib/workers/worker-queries";
import { pickDefaultWorker } from "@/lib/workers/active-worker";
import { parseWorkerTab } from "@/lib/workers/worker-tab";
import { WorkerDetail } from "@/components/features/workers/detail/worker-detail";
import { Button } from "@/components/ui/button";

type PageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function WorkersPage({ searchParams }: PageProps) {
  const [workers, { tab }] = await Promise.all([listWorkers(), searchParams]);

  if (workers.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-start gap-3 px-4 pt-6 sm:px-6 lg:px-7">
        <h2 className="text-card-title">No workers yet</h2>
        <p className="max-w-md text-body text-[var(--fg-3)]">
          Add a worker to start tracking documents, accommodation and
          timesheets.
        </p>
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/workers/new" />}
        >
          <Plus />
          Add your first worker
        </Button>
      </div>
    );
  }

  const defaultWorker = pickDefaultWorker(workers);
  return defaultWorker ? (
    <WorkerDetail id={defaultWorker.id} tab={parseWorkerTab(tab)} />
  ) : null;
}
