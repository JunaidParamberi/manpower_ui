"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
  useSelectedLayoutSegment,
} from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useEffect } from "react";

import { pickDefaultWorker } from "@/lib/workers/active-worker";
import { AddWorkerButton } from "@/components/features/workers/add-worker-button";
import { WorkersListCard } from "@/components/features/workers/overview/workers-list-card";
import { PaneSearchBox } from "@/components/shared/pane-search-box";
import type { WorkerListRow } from "@/types";

type WorkersListPaneProps = {
  workers: WorkerListRow[];
};

function workerMatchesQuery(worker: WorkerListRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    worker.name,
    worker.employee_id,
    worker.nationality,
    worker.trade_category,
    worker.supplier?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function WorkersListPane({ workers }: WorkersListPaneProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = useSelectedLayoutSegment();
  // On /workers the page renders a default worker; mirror that pick.
  const selectedId = activeId ?? pickDefaultWorker(workers)?.id ?? null;
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const queryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (queryTimer.current) clearTimeout(queryTimer.current);
    };
  }, []);

  function setParams(next: { q?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q.trim()) params.set("q", next.q.trim());
      else params.delete("q");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function onSearch(next: string) {
    setQuery(next);
    if (queryTimer.current) clearTimeout(queryTimer.current);
    queryTimer.current = setTimeout(() => setParams({ q: next }), 250);
  }

  const visible = useMemo(
    () => workers.filter((w) => workerMatchesQuery(w, query)),
    [workers, query],
  );

  function goToWorker(workerId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab");
    const qs = params.toString();
    router.push(qs ? `/workers/${workerId}?${qs}` : `/workers/${workerId}`);
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 pt-4 pb-3.5 sm:px-6 lg:px-7 lg:pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-heading text-[17px] font-semibold tracking-[-0.01em]">
              Workers
            </h1>
            <p className="mt-0.5 truncate text-meta text-[var(--fg-3)]">
              <span className="tabular-nums">{workers.length}</span> worker
              {workers.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <AddWorkerButton compact />
          </div>
        </div>
        <PaneSearchBox
          value={query}
          onChange={onSearch}
          placeholder="Find a worker"
          ariaLabel="Find a worker"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <WorkersListCard
          workers={visible}
          selectedId={selectedId}
          onClearFilters={() => {
            if (queryTimer.current) clearTimeout(queryTimer.current);
            setQuery("");
            router.replace(pathname, { scroll: false });
          }}
          onSelect={goToWorker}
        />
      </div>
    </div>
  );
}
