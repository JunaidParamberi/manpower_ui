import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/features/projects/project-form";
import { FormPageShell } from "@/components/shared/form-page-shell";
import { listClients } from "@/lib/clients/actions";
import { projectRowToFormValues } from "@/lib/projects/form-values";
import { getProjectById } from "@/lib/projects/actions";
import { pageTitle } from "@/lib/metadata";
import { PageHeader } from "@/components/shared/page-header";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id);
  return {
    title: project ? pageTitle("Edit", project.title) : "Edit",
  };
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) {
    notFound();
  }

  const clientsResult = await listClients();
  const clients = clientsResult.ok ? clientsResult.clients : [];
  const formDefaults = projectRowToFormValues(project);

  return (
    <FormPageShell maxWidth="7xl">
      <div className="flex flex-col gap-8">
        <PageHeader
          backHref={`/projects/${project.id}`}
          backLabel="Back to project"
          title="Edit project"
          description="Update title, client link, status, and dates. Task work stays on the project page."
        />
        <ProjectForm
          mode="edit"
          projectId={project.id}
          clients={clients}
          defaultValues={formDefaults}
        />
      </div>
    </FormPageShell>
  );
}
