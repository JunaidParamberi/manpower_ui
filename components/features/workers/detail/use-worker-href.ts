"use client";

import { useSearchParams } from "next/navigation";

import { workerHref, type WorkerTab } from "@/lib/workers/worker-tab";

/** Hrefs inside the detail pane that carry the list pane's q/lens, so tab navigation keeps the list filtered. */
export function useWorkerHref() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q");
  const lens = searchParams.get("lens");
  return {
    detail: (workerId: string, tab?: WorkerTab) => workerHref(workerId, { tab, q, lens }),
    edit: (workerId: string) => workerHref(workerId, { edit: true, q, lens }),
  };
}
