import { Metadata } from "next";

import { ProjectTemplatesManager } from "@/components/features/projects/project-templates-manager";
import { listProjectTemplateSummaries } from "@/lib/projects/template-queries";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Project templates",
};

export default async function ProjectTemplatesPage() {
  const templates = await listProjectTemplateSummaries();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <PageHeader
          backHref="/projects"
          backLabel="Projects"
          title="Project templates"
          description="Start new projects from Manpower starter templates or your saved structures. Save a template from any project menu to add milestones and tasks you reuse often."
        />

        <ProjectTemplatesManager templates={templates} />
      </div>
    </div>
  );
}
