import type { Metadata } from "next";
import { z } from "zod";

import { NewProjectView } from "@/components/features/projects/new-project-view";
import { FormPageShell } from "@/components/shared/form-page-shell";
import { listClients } from "@/lib/clients/actions";
import { getProjectTemplate, listProjectTemplateSummaries } from "@/lib/projects/template-queries";
import { getProposalWithLineItems } from "@/lib/documents/proposal-queries";
import { projectCreateDefaultsForClient, projectCreateDefaultsFromPlanDraft } from "@/lib/projects/form-values";
import { buildProjectPlanDraftFromProposal } from "@/lib/projects/proposal-to-project";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "New project",
};

type NewProjectPageProps = {
  searchParams: Promise<{
    client?: string;
    proposal?: string;
    template?: string;
  }>;
};

const uuidSchema = z.string().uuid();

export default async function NewProjectPage({
  searchParams,
}: NewProjectPageProps) {
  const {
    client: requestedClientId,
    proposal: proposalDocumentId,
    template: requestedTemplateId,
  } = await searchParams;
  const [clientsResult, templates] = await Promise.all([
    listClients(),
    listProjectTemplateSummaries(),
  ]);
  const clients = clientsResult.ok ? clientsResult.clients : [];

  const parsedTemplateId = requestedTemplateId
    ? uuidSchema.safeParse(requestedTemplateId)
    : null;
  const initialTemplateId =
    parsedTemplateId?.success &&
    templates.some((template) => template.id === parsedTemplateId.data)
      ? parsedTemplateId.data
      : null;

  const initialTemplateDetail = initialTemplateId
    ? await getProjectTemplate(initialTemplateId)
    : null;

  let planDraft = null;
  if (proposalDocumentId) {
    const proposal = await getProposalWithLineItems(proposalDocumentId);
    if (
      proposal &&
      proposal.status === "approved" &&
      proposal.proposal_content
    ) {
      planDraft = buildProjectPlanDraftFromProposal(proposal.proposal_content);
    }
  }

  const defaultValues = planDraft
    ? projectCreateDefaultsFromPlanDraft({
        clients,
        requestedClientId,
        planDraft,
      })
    : projectCreateDefaultsForClient({
        clients,
        requestedClientId,
      });

  return (
    <FormPageShell maxWidth="7xl">
      <div className="flex flex-col gap-8">
        <PageHeader
          backHref="/projects"
          backLabel="Projects"
          title="New project"
          description="Pick a Manpower starter or your saved template, or start blank. Then connect work to a client, set dates and budget, and break deliverables into tasks on the project page."
        />
        <NewProjectView
          clients={clients}
          templates={templates}
          defaultValues={defaultValues}
          planDraft={planDraft}
          initialTemplateId={initialTemplateId}
          initialTemplateDetail={initialTemplateDetail}
        />
      </div>
    </FormPageShell>
  );
}
