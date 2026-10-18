"use client";

import { useMemo } from "react";

import { uploadedRequiredCount } from "@/lib/workers/worker-readiness";
import type { WorkerTab } from "@/lib/workers/worker-tab";
import type { WorkerListRow } from "@/types";

import { WorkerAccommodationTab } from "@/components/features/workers/detail/worker-accommodation-tab";
import { WorkerClientsSection } from "@/components/features/workers/detail/worker-clients-section";
import { WorkerDetailHeader } from "@/components/features/workers/detail/worker-detail-header";
import { WorkerDetailTabs } from "@/components/features/workers/detail/worker-detail-tabs";
import { WorkerDetailsTab } from "@/components/features/workers/detail/worker-details-tab";
import { WorkerDocumentsTab } from "@/components/features/workers/detail/worker-documents-tab";
import { WorkerOverview } from "@/components/features/workers/detail/worker-overview";
import { WorkerStatStrip } from "@/components/features/workers/detail/worker-stat-strip";
import { WorkerTimesheetsTab } from "@/components/features/workers/detail/worker-timesheets-tab";

export function WorkerDetailView({ worker, tab }: { worker: WorkerListRow; tab: WorkerTab }) {
  const nowIso = useMemo(() => new Date().toISOString(), []);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <WorkerDetailHeader worker={worker} nowIso={nowIso} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <WorkerStatStrip worker={worker} nowIso={nowIso} />
        <WorkerDetailTabs
          tab={tab}
          counts={{ documents: uploadedRequiredCount(worker), clients: worker.clients.length }}
        />
        {tab === "overview" ? (
          <div className="pb-10">
            <WorkerOverview worker={worker} nowIso={nowIso} />
          </div>
        ) : (
          <div className="px-4 py-5 sm:px-6 lg:px-7">
            {tab === "documents" ? <WorkerDocumentsTab worker={worker} /> : null}
            {tab === "clients" ? (
              <WorkerClientsSection worker={worker} className="px-0 pt-0 sm:px-0 lg:px-0" />
            ) : null}
            {tab === "accommodation" ? <WorkerAccommodationTab /> : null}
            {tab === "timesheets" ? <WorkerTimesheetsTab /> : null}
            {tab === "about" ? <WorkerDetailsTab worker={worker} /> : null}
          </div>
        )}
      </div>
    </div>
  );
}
