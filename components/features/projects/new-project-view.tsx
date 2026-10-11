"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProjectForm } from "@/components/features/projects/project-form";
import { ProjectTemplatePicker } from "@/components/features/projects/project-template-picker";
import type { ProjectPlanDraft } from "@/lib/projects/proposal-to-project";
import type { ProjectCreateFormInput } from "@/lib/validations/project";
import type {
  ClientRow,
  ProjectTemplateSummaryRow,
  ProjectTemplateWithDetails,
} from "@/types";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type NewProjectViewProps = {
  clients: ClientRow[];
  templates: ProjectTemplateSummaryRow[];
  defaultValues: ProjectCreateFormInput;
  planDraft: ProjectPlanDraft | null;
  initialTemplateId: string | null;
  initialTemplateDetail: ProjectTemplateWithDetails | null;
};

export function NewProjectView({
  clients,
  templates,
  defaultValues,
  planDraft,
  initialTemplateId,
  initialTemplateDetail,
}: NewProjectViewProps) {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    initialTemplateId,
  );

  const selectedSummary =
    templates.find((template) => template.id === selectedTemplateId) ?? null;
  const selectedDetail =
    selectedTemplateId && initialTemplateDetail?.id === selectedTemplateId
      ? initialTemplateDetail
      : null;

  const previewMilestoneCount =
    selectedDetail?.milestones.length ?? selectedSummary?.milestone_count ?? 0;
  const previewTaskCount =
    selectedDetail?.tasks.length ?? selectedSummary?.task_count ?? 0;

  const templateDefaultValues =
    selectedSummary && !planDraft
      ? {
          ...defaultValues,
          title: defaultValues.title || selectedSummary.name,
        }
      : defaultValues;

  function handleTemplateChange(templateId: string | null) {
    setSelectedTemplateId(templateId);
    const params = new URLSearchParams(window.location.search);
    if (templateId) {
      params.set("template", templateId);
    } else {
      params.delete("template");
    }
    const query = params.toString();
    router.replace(query ? `/projects/new?${query}` : "/projects/new", {
      scroll: false,
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {!planDraft ? (
        <ProjectTemplatePicker
          templates={templates}
          selectedId={selectedTemplateId}
          onChange={handleTemplateChange}
        />
      ) : null}

      {!planDraft && selectedTemplateId ? (
        <Alert>
          <AlertTitle>
            {selectedSummary?.name ?? "Template"} selected
          </AlertTitle>
          <AlertDescription>
            {previewMilestoneCount} milestone
            {previewMilestoneCount === 1 ? "" : "s"} and {previewTaskCount} task
            {previewTaskCount === 1 ? "" : "s"} will be added when you save this
            project.
            {selectedSummary?.description
              ? ` ${selectedSummary.description}`
              : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <ProjectForm
        mode="create"
        clients={clients}
        defaultValues={templateDefaultValues}
        planDraft={planDraft}
        selectedTemplateId={selectedTemplateId}
      />
    </div>
  );
}
