import { notFound } from "next/navigation";

import { ClientDetailView } from "@/components/features/clients/detail/client-detail-view";
import { getClientById } from "@/lib/clients/actions";
import type { ClientTab } from "@/lib/clients/client-tab";
import { getLatestClientHealth } from "@/lib/clients/health-queries";
import { listDocumentsForClient } from "@/lib/documents/document-queries";
import { listProjectsForClient } from "@/lib/projects/actions";
import { getProfile } from "@/lib/profile/actions";

export async function ClientDetail({ id, tab = "overview" }: { id: string; tab?: ClientTab }) {
  const client = await getClientById(id);
  if (!client) {
    notFound();
  }

  const [projectsResult, documentsResult, profileResult, healthSnapshot] =
    await Promise.all([
      listProjectsForClient(id),
      listDocumentsForClient(id),
      getProfile(),
      getLatestClientHealth(id),
    ]);
  const projects = projectsResult.ok ? projectsResult.projects : [];
  const documents = documentsResult.ok ? documentsResult.documents : [];
  const defaultCurrency =
    (profileResult.ok && profileResult.profile?.default_currency) || "USD";

  return (
    <ClientDetailView
      client={client}
      projects={projects}
      documents={documents}
      defaultCurrency={defaultCurrency}
      healthSnapshot={healthSnapshot}
      tab={tab}
    />
  );
}
