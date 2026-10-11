"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { BookTemplate, FileText, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteProjectTemplate,
  renameProjectTemplate,
} from "@/lib/projects/template-actions";
import { splitProjectTemplates } from "@/lib/projects/template-display";
import type { ProjectTemplateSummaryRow } from "@/types";

import {
  ProjectTemplateCard,
  ProjectTemplateSectionHeading,
  ProjectTemplateUseButton,
} from "@/components/features/projects/project-template-card";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProjectTemplatesManagerProps = {
  templates: ProjectTemplateSummaryRow[];
};

export function ProjectTemplatesManager({
  templates,
}: ProjectTemplatesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [renameTarget, setRenameTarget] = useState<ProjectTemplateSummaryRow | null>(
    null,
  );
  const [renameName, setRenameName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProjectTemplateSummaryRow | null>(
    null,
  );

  const { systemTemplates, userTemplates } = useMemo(
    () => splitProjectTemplates(templates),
    [templates],
  );

  const handleRename = () => {
    if (!renameTarget) return;
    const name = renameName.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await renameProjectTemplate({
        templateId: renameTarget.id,
        name,
      });
      if (!result.ok) {
        toast.error(result.message ?? "Failed to rename template");
        return;
      }
      setRenameTarget(null);
      setRenameName("");
      toast.success("Template renamed");
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteProjectTemplate(deleteTarget.id);
      if (!result.ok) {
        toast.error(result.message ?? "Failed to delete template");
        return;
      }
      setDeleteTarget(null);
      toast.success("Template deleted");
      router.refresh();
    });
  };

  function goToTemplate(templateId: string) {
    router.push(`/projects/new?template=${templateId}`);
  }

  return (
    <>
      <div className="flex flex-col gap-10">
        {systemTemplates.length > 0 ? (
          <section className="flex flex-col gap-4">
            <ProjectTemplateSectionHeading icon={<BookTemplate className="size-3.5" />}>
              Manpower starters
            </ProjectTemplateSectionHeading>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {systemTemplates.map((template) => (
                <ProjectTemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => goToTemplate(template.id)}
                  disabled={isPending}
                  footerActions={
                    <ProjectTemplateUseButton
                      onClick={() => goToTemplate(template.id)}
                      disabled={isPending}
                    />
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="flex flex-col gap-4">
          <ProjectTemplateSectionHeading icon={<FileText className="size-3.5" />}>
            Your templates
          </ProjectTemplateSectionHeading>
          {userTemplates.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {userTemplates.map((template) => (
                <ProjectTemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => goToTemplate(template.id)}
                  disabled={isPending}
                  footerActions={
                    <div className="flex items-center gap-2">
                      <ProjectTemplateUseButton
                        onClick={() => goToTemplate(template.id)}
                        disabled={isPending}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        aria-label="Rename template"
                        disabled={isPending}
                        onClick={() => {
                          setRenameName(template.name);
                          setRenameTarget(template);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-destructive hover:text-destructive"
                        aria-label="Delete template"
                        disabled={isPending}
                        onClick={() => setDeleteTarget(template)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyStateCard
              icon={BookTemplate}
              title="No saved templates yet"
              description="Open a project and choose Save as template from the project menu to reuse milestones and tasks."
              action={
                <Button nativeButton={false} render={<Link href="/projects" />} variant="outline">
                  Go to projects
                </Button>
              }
            />
          )}
        </section>
      </div>

      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
            setRenameName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename template</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rename-template-name">New name</Label>
            <Input
              id="rename-template-name"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameTarget(null);
                setRenameName("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={isPending || !renameName.trim()}
              onClick={handleRename}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; will be permanently deleted.
              Existing projects created from this template are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
