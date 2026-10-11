"use client";

import { useMemo } from "react";
import { BookTemplate, FileText } from "lucide-react";

import { splitProjectTemplates } from "@/lib/projects/template-display";
import type { ProjectTemplateSummaryRow } from "@/types";

import {
  ProjectBlankCard,
  ProjectTemplateCard,
  ProjectTemplateSectionHeading,
} from "@/components/features/projects/project-template-card";

type ProjectTemplatePickerProps = {
  templates: ProjectTemplateSummaryRow[];
  selectedId: string | null;
  onChange: (templateId: string | null) => void;
  disabled?: boolean;
};

export function ProjectTemplatePicker({
  templates,
  selectedId,
  onChange,
  disabled = false,
}: ProjectTemplatePickerProps) {
  const { systemTemplates, userTemplates } = useMemo(
    () => splitProjectTemplates(templates),
    [templates],
  );

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <ProjectTemplateSectionHeading icon={<BookTemplate className="size-3.5" />}>
          Start from a template
        </ProjectTemplateSectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProjectBlankCard
            selected={selectedId === null}
            onClick={() => onChange(null)}
            disabled={disabled}
          />
          {systemTemplates.map((template) => (
            <ProjectTemplateCard
              key={template.id}
              template={template}
              selected={selectedId === template.id}
              onSelect={() => onChange(template.id)}
              disabled={disabled}
            />
          ))}
        </div>
      </section>

      {userTemplates.length > 0 ? (
        <section className="flex flex-col gap-4">
          <ProjectTemplateSectionHeading icon={<FileText className="size-3.5" />}>
            Your templates
          </ProjectTemplateSectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userTemplates.map((template) => (
              <ProjectTemplateCard
                key={template.id}
                template={template}
                selected={selectedId === template.id}
                onSelect={() => onChange(template.id)}
                disabled={disabled}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
