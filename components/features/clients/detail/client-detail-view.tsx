import { buildClientActivityTimeline } from "@/lib/clients/client-activity";
import { computeClientFinancialSummary } from "@/lib/clients/client-financial-summary";
import { openDocuments, openProjects } from "@/lib/clients/client-open-items";
import type { ClientTab } from "@/lib/clients/client-tab";
import type { ClientHealthSnapshotRow } from "@/lib/clients/health-queries";
import { clientHelp } from "@/lib/kraft/record-help";
import type { ClientRow, DocumentListRow, ProjectListRow } from "@/types";

import { KraftRecordHelp } from "@/components/features/ai-panel/kraft-record-help";
import { ClientAbout } from "@/components/features/clients/detail/client-about";
import { ClientActivityTimeline } from "@/components/features/clients/detail/client-activity-timeline";
import { ClientDetailHeader } from "@/components/features/clients/detail/client-detail-header";
import { ClientDetailTabs } from "@/components/features/clients/detail/client-detail-tabs";
import { ClientDocumentsSection } from "@/components/features/clients/detail/client-documents-section";
import { ClientHealthPanel } from "@/components/features/clients/detail/client-health-panel";
import { ClientMoneyStrip } from "@/components/features/clients/detail/client-money-strip";
import { ClientProjectsSection } from "@/components/features/clients/detail/client-projects-section";

type ClientDetailViewProps = {
  client: ClientRow;
  projects: ProjectListRow[];
  documents: DocumentListRow[];
  defaultCurrency?: string;
  healthSnapshot: ClientHealthSnapshotRow | null;
  tab: ClientTab;
};

const DONE = new Set<ProjectListRow["status"]>(["completed", "archived"]);

export function ClientDetailView({
  client,
  projects,
  documents,
  defaultCurrency = "USD",
  healthSnapshot,
  tab,
}: ClientDetailViewProps) {
  const clientProjects = projects.filter((p) => p.client_id === client.id);
  const currency = client.currency ?? defaultCurrency;
  const summary = computeClientFinancialSummary({ documents, fallbackCurrency: currency });
  const doneProjects = clientProjects.filter((p) => DONE.has(p.status)).length;
  const tabHref = (t: ClientTab) => `/clients/${client.id}?tab=${t}`;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <ClientDetailHeader
        client={client}
        linkedProjectsCount={clientProjects.length}
        linkedDocumentsCount={documents.length}
        kraft={
          <KraftRecordHelp
            help={clientHelp({
              name: client.name,
              contactName: client.contact_name,
              healthScore: healthSnapshot?.score ?? null,
              signals: healthSnapshot?.signals ?? [],
            })}
          />
        }
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <ClientMoneyStrip
          summary={summary}
          activeProjects={clientProjects.length - doneProjects}
          doneProjects={doneProjects}
        />
        <ClientDetailTabs tab={tab} counts={{ projects: clientProjects.length, documents: documents.length }} />
        {/* Grows to the bottom of the pane so column dividers (About) run full height. */}
        <div className={tab === "about" ? "flex flex-1 flex-col" : "pb-10"}>
          {tab === "overview" ? (
            <>
              <ClientHealthPanel
                clientId={client.id}
                clientName={client.name}
                clientEmail={client.email}
                snapshot={healthSnapshot}
              />
              <div className="grid min-w-0 @3xl/shell:grid-cols-2">
                <ClientProjectsSection
                  clientId={client.id}
                  title="Open projects"
                  projects={openProjects(clientProjects)}
                  count={openProjects(clientProjects, Infinity).length}
                  viewAllHref={tabHref("projects")}
                />
                <ClientDocumentsSection
                  clientId={client.id}
                  title="Open documents"
                  documents={openDocuments(documents)}
                  count={openDocuments(documents, Infinity).length}
                  currency={currency}
                  viewAllHref={tabHref("documents")}
                />
              </div>
            </>
          ) : null}
          {tab === "projects" ? <ClientProjectsSection clientId={client.id} projects={clientProjects} /> : null}
          {tab === "documents" ? (
            <ClientDocumentsSection clientId={client.id} documents={documents} currency={currency} />
          ) : null}
          {tab === "activity" ? (
            <ClientActivityTimeline
              items={buildClientActivityTimeline({ client, projects: clientProjects, documents })}
            />
          ) : null}
          {tab === "about" ? <ClientAbout client={client} /> : null}
        </div>
      </div>
    </div>
  );
}
