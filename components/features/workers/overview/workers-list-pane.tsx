"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
  useSelectedLayoutSegment,
} from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";

import { pickDefaultWorker } from "@/lib/workers/active-worker";
import {
  countWorkerLenses,
  matchesWorkerLens,
  parseWorkerLens,
  type WorkerLens,
} from "@/lib/workers/worker-readiness";
import { AddWorkerButton } from "@/components/features/workers/add-worker-button";
import { WorkersListCard } from "@/components/features/workers/overview/workers-list-card";
import { WorkerLensChips } from "@/components/features/workers/overview/worker-lens-chips";
import { PaneSearchBox } from "@/components/shared/pane-search-box";
import { Button } from "@/components/ui/button";
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
  const lens = parseWorkerLens(searchParams.get("lens"));
  const now = useMemo(() => new Date().toISOString(), []);
  const queryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (queryTimer.current) clearTimeout(queryTimer.current);
    };
  }, []);

  function setParams(next: { q?: string; lens?: WorkerLens }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q.trim()) params.set("q", next.q.trim());
      else params.delete("q");
    }
    if (next.lens !== undefined) {
      if (next.lens === "all") params.delete("lens");
      else params.set("lens", next.lens);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function onSearch(next: string) {
    setQuery(next);
    if (queryTimer.current) clearTimeout(queryTimer.current);
    queryTimer.current = setTimeout(() => setParams({ q: next }), 250);
  }

  const counts = useMemo(() => countWorkerLenses(workers, now), [workers, now]);
  const deployed = counts.deployed;
  const needsYou = counts["needs-you"];
  const visible = useMemo(
    () => workers.filter((w) => matchesWorkerLens(w, lens, now) && workerMatchesQuery(w, query)),
    [workers, lens, query, now],
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
              {workers.length === 1 ? "" : "s"} · <span className="tabular-nums">{deployed}</span> deployed
              {needsYou > 0 ? (
                <span className="font-medium text-[var(--danger)]"> · {needsYou} need you</span>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled
              title="Worker import is coming soon"
              aria-label="Import workers (coming soon)"
            >
              <Upload />
            </Button>
            <AddWorkerButton compact />
          </div>
        </div>
        <PaneSearchBox
          value={query}
          onChange={onSearch}
          placeholder="Find a worker"
          ariaLabel="Find a worker"
        />
        <WorkerLensChips lens={lens} counts={counts} onChange={(l) => setParams({ lens: l })} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <WorkersListCard
          workers={visible}
          selectedId={selectedId}
          groups={lens === "all" && !query.trim()}
          nowIso={now}
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
