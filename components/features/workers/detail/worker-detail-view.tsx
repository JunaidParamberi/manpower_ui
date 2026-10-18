"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateWorkerStatus } from "@/lib/workers/worker-mutations";
import {
  WORKER_STATUSES,
  WORKER_STATUS_LABELS,
} from "@/lib/validations/worker";
import type { WorkerTab } from "@/lib/workers/worker-tab";
import type { WorkerListRow } from "@/types";

import { WorkerAccommodationTab } from "@/components/features/workers/detail/worker-accommodation-tab";
import { WorkerDetailsTab } from "@/components/features/workers/detail/worker-details-tab";
import { WorkerDocumentsTab } from "@/components/features/workers/detail/worker-documents-tab";
import { WorkerTimesheetsTab } from "@/components/features/workers/detail/worker-timesheets-tab";
import { DeleteWorkerButton } from "@/components/features/workers/delete-worker-button";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export function WorkerDetailView({
  worker,
  tab,
}: {
  worker: WorkerListRow;
  tab: WorkerTab;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onTabChange(next: string) {
    router.replace(`/workers/${worker.id}?tab=${next}`);
  }

  function onStatusChange(next: string | null) {
    if (!next) return;
    startTransition(async () => {
      const result = await updateWorkerStatus(worker.id, next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:gap-10">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-heading text-2xl tracking-tight">
                {worker.name}
              </h1>
              <p className="text-muted-foreground">
                Worker / employee registry.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={`/workers/${worker.id}/edit`} />}
              >
                Edit
              </Button>
              <DeleteWorkerButton
                workerId={worker.id}
                workerName={worker.name}
              />
            </div>
          </div>

          <Tabs value={tab} onValueChange={onTabChange} className="mt-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="accommodation">Accommodation</TabsTrigger>
              <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <WorkerDetailsTab worker={worker} />
            </TabsContent>
            <TabsContent value="documents">
              <WorkerDocumentsTab worker={worker} />
            </TabsContent>
            <TabsContent value="accommodation">
              <WorkerAccommodationTab />
            </TabsContent>
            <TabsContent value="timesheets">
              <WorkerTimesheetsTab />
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-full shrink-0 lg:w-64">
          <label
            className="text-sm font-medium text-muted-foreground"
            htmlFor="worker-status-select"
          >
            Status
          </label>
          <Select
            value={worker.status}
            onValueChange={onStatusChange}
            disabled={isPending}
          >
            <SelectTrigger id="worker-status-select">
              <span className="truncate text-start">
                {WORKER_STATUS_LABELS[worker.status]}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {WORKER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {WORKER_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
